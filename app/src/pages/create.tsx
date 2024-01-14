import { FC, useEffect, useMemo, useState } from "react";
import useProgram from "hooks/useProgram";
import axios from "axios";
import {
  DasApiAsset,
  DasApiAssetList,
} from "@metaplex-foundation/digital-asset-standard-api";
import SelectTokenInput from "components/create/SelectTokenInput";
import ReviewLockCard from "components/ReviewLockCard";
import Head from "next/head";
import StartDateInput from "components/create/StartDateInput";
import { useDates } from "hooks/useDates";
import VestingDatesInput from "components/create/VestingDatesInput";
import RecipientInput from "components/create/RecipientInput";
import PayoutIntervalInput from "components/create/PayoutIntervalInput";
import CliffPaymentAmountInput from "components/create/CliffPaymentAmountInput";
import AuthoritiesInput from "components/create/AuthoritiesInput";
import { notify } from "utils/notifications";
import { shortenSignature } from "utils/formatters";
import VestmentChart from "components/create/VestmentChart";
import { useRouter } from "next/router";
import {
  Authority,
  CreateLockInstructionAccounts,
  CreateLockInstructionArgs,
  createCreateLockInstruction,
} from "program/generated";
import {
  PublicKey,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import {
  getLockKey,
  getLockTokenAccountKey,
  getLockerKey,
  getTreasuryKey,
  getUserTokenAccountKey,
} from "program/accounts";
import { toWeb3JsPublicKey } from "@metaplex-foundation/umi-web3js-adapters";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";

const Create: FC = () => {
  const router = useRouter();
  const { wallet, connection } = useProgram();
  const { tomorrow, thirtyDays, ninetyDaysFromNow } = useDates();

  const [assets, setAssets] = useState<DasApiAsset[]>([]);

  // Lock State
  const [startDate, setStartDate] = useState<Date>(tomorrow);
  const [vestingDuration, setVestingDuration] = useState<number>(0);
  const [vestingEndDate, setVestingEndDate] = useState<Date>(
    new Date(ninetyDaysFromNow)
  );
  useEffect(() => {
    setVestingDuration(vestingEndDate.getTime() - startDate.getTime());
  }, [vestingEndDate]);
  const [recipient, setRecipient] = useState<string>("");
  const [payoutInterval, setPayoutInterval] = useState<number>(thirtyDays);
  const [selectedToken, setSelectedToken] = useState<DasApiAsset | null>(null);
  const [amountToBeVested, setAmountToBeVested] = useState<number | string>("");
  const [cliffPaymentAmount, setCliffPaymentAmount] = useState<number | string>(
    ""
  );
  const [cancelAuthority, setCancelAuthority] = useState<Authority>(
    Authority.Neither
  );
  const [changeRecipientAuthority, setChangeRecipientAuthority] =
    useState<Authority>(Authority.Neither);

  const balance = useMemo(
    () =>
      // @ts-ignore
      selectedToken?.token_info.balance
        ? // @ts-ignore
          selectedToken?.token_info.balance /
          // @ts-ignore
          10 ** selectedToken?.token_info.decimals
        : 0,
    [selectedToken]
  );

  // Methods
  const onReset = () => {
    setStartDate(tomorrow);
    setVestingEndDate(new Date(ninetyDaysFromNow));
    setRecipient("");
    setPayoutInterval(thirtyDays);
    setSelectedToken(null);
    setAmountToBeVested(null);
    setCliffPaymentAmount(null);
    setCancelAuthority(Authority.Neither);
    setChangeRecipientAuthority(Authority.Neither);
  };

  const onSubmit = async () => {
    const createLockInstructionArgs: CreateLockInstructionArgs = {
      cancelAuthority,
      changeRecipientAuthority,
      amountToBeVested: Number(amountToBeVested),
      cliffPaymentAmount: Number(cliffPaymentAmount),
      vestingDuration: Number(vestingDuration / 1000),
      payoutInterval: Math.floor(payoutInterval / 1000),
      startDate: Math.floor(startDate.getTime() / 1000),
    };

    console.log("Create Lock Instruction Args:", createLockInstructionArgs);

    const createLockInstructionAccounts: CreateLockInstructionAccounts = {
      funder: wallet.publicKey,
      recipient: new PublicKey(recipient),
      locker: getLockerKey(),
      treasury: getTreasuryKey(),
      lock: getLockKey(wallet.publicKey, toWeb3JsPublicKey(selectedToken.id)),
      lockTokenAccount: getLockTokenAccountKey(
        getLockKey(wallet.publicKey, toWeb3JsPublicKey(selectedToken.id)),
        wallet.publicKey,
        toWeb3JsPublicKey(selectedToken.id)
      ),
      funderTokenAccount: getUserTokenAccountKey(
        wallet.publicKey,
        toWeb3JsPublicKey(selectedToken.id)
      ),
      recipientTokenAccount: getUserTokenAccountKey(
        new PublicKey(recipient),
        toWeb3JsPublicKey(selectedToken.id)
      ),
      mint: toWeb3JsPublicKey(selectedToken.id),
      tokenProgram: TOKEN_2022_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
    };

    console.log(
      "Create Lock Instruction Accounts:",
      createLockInstructionAccounts
    );

    try {
      const createLockInstruction = createCreateLockInstruction(
        createLockInstructionAccounts,
        createLockInstructionArgs
      );

      const latestBlockhash = await connection.getLatestBlockhash();
      const messageV0 = new TransactionMessage({
        payerKey: wallet.publicKey,
        recentBlockhash: latestBlockhash.blockhash,
        instructions: [createLockInstruction],
      }).compileToV0Message();

      const tx = new VersionedTransaction(messageV0);
      const txid = await wallet.sendTransaction(tx, connection);
      const confirmation = await connection.confirmTransaction({
        signature: txid,
        blockhash: latestBlockhash.blockhash,
        lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
      });

      if (confirmation.value.err) {
        notify({
          message: "Transaction Failed",
          description: `Transaction ${shortenSignature(txid)} failed (${
            confirmation.value.err
          })`,
          type: "error",
        });
      }

      notify({
        message: "Transaction sent",
        description: `Transaction ${shortenSignature(txid)} has been sent`,
        type: "success",
      });

      router.push("/dashboard");
    } catch (error) {
      console.log("-> ~ error", error);
      notify({
        message: "Transaction Failed",
        description: `${error}`,
        type: "error",
      });
    }
  };

  const onPageLoad = async () => {
    const {
      data: { cursor, items, limit, total },
    } = await axios.get<DasApiAssetList>(
      `/api/getTokensByOwner/?owner=${wallet.publicKey.toString()}`
    );

    setAssets(items);
    setSelectedToken(items[0]);
  };

  useEffect(() => {
    // Get all of the owners SPL Tokens and put them in a select/dropdown
    if (wallet?.publicKey && wallet?.signTransaction) {
      onPageLoad();
    }
  }, [wallet?.publicKey]);

  return (
    <>
      <Head>
        <title>Valhalla | Token Vesting Solutions</title>
        <meta
          name="description"
          content="Token Vesting and Locks on Solana. Lock your tokens until Valhalla."
        />
      </Head>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 lg:gap-8">
        <div className="card">
          <div className="card-body">
            <div className="card-title">Configure the vesting account</div>
            <RecipientInput recipient={recipient} setRecipient={setRecipient} />

            <SelectTokenInput
              assets={assets}
              amountToBeVested={+amountToBeVested}
              setAmountToBeVested={setAmountToBeVested}
              selectedToken={selectedToken}
              setSelectedToken={setSelectedToken}
            />

            <StartDateInput startDate={startDate} setStartDate={setStartDate} />

            <VestingDatesInput
              startDate={startDate}
              vestingEndDate={vestingEndDate}
              setVestingEndDate={setVestingEndDate}
            />

            <PayoutIntervalInput
              payoutInterval={payoutInterval}
              setPayoutInterval={setPayoutInterval}
            />

            <CliffPaymentAmountInput
              selectedToken={selectedToken}
              amountToBeVested={+amountToBeVested}
              cliffPaymentAmount={+cliffPaymentAmount}
              setCliffPaymentAmount={setCliffPaymentAmount}
            />

            <AuthoritiesInput
              cancelAuthority={cancelAuthority}
              setCancelAuthority={setCancelAuthority}
              changeRecipientAuthority={changeRecipientAuthority}
              setChangeRecipientAuthority={setChangeRecipientAuthority}
            />

            <div className="card-actions mt-2">
              <button className="btn btn-secondary" onClick={onReset}>
                Reset
              </button>
              <button className="btn btn-accent" onClick={onSubmit}>
                Submit
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 lg:gap-8">
          <VestmentChart
            vestingEndDate={vestingEndDate}
            startDate={startDate}
            vestingDuration={vestingDuration}
            amountToBeVested={+amountToBeVested}
            payoutInterval={payoutInterval}
            cliffPaymentAmount={+cliffPaymentAmount}
          />

          <ReviewLockCard
            funder={wallet.publicKey}
            recipient={recipient}
            selectedToken={selectedToken}
            startDate={startDate}
            vestingDuration={vestingDuration}
            amountToBeVested={+amountToBeVested}
            payoutInterval={payoutInterval}
            cliffPaymentAmount={+cliffPaymentAmount}
            cancelAuthority={cancelAuthority}
            changeRecipientAuthority={changeRecipientAuthority}
          />
        </div>
      </div>
    </>
  );
};

export default Create;
