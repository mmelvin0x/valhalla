import { ChangeEvent, FC, useEffect, useState } from "react";
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
  getPDAs,
  getTreasuryKey,
  getUserTokenAccountKey,
} from "program/accounts";
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
  const [name, setName] = useState<string>("");
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
      vestingDuration: Math.round(Number(vestingDuration / 1000)),
      payoutInterval: Math.round(payoutInterval / 1000),
      startDate: Math.round(startDate.getTime() / 1000),
    };

    Object.keys(createLockInstructionArgs).forEach((key) => {
      console.log(key, createLockInstructionArgs[key]);
    });

    const [locker, lock, lockTokenAccount] = getPDAs(
      wallet.publicKey,
      new PublicKey(selectedToken.id)
    );

    const createLockInstructionAccounts: CreateLockInstructionAccounts = {
      funder: wallet.publicKey,
      recipient: new PublicKey(recipient),
      locker,
      treasury: getTreasuryKey(),
      lock,
      lockTokenAccount,
      funderTokenAccount: getUserTokenAccountKey(
        wallet.publicKey,
        new PublicKey(selectedToken.id)
      ),
      recipientTokenAccount: getUserTokenAccountKey(
        new PublicKey(recipient),
        new PublicKey(selectedToken.id)
      ),
      mint: new PublicKey(selectedToken.id),
      tokenProgram: TOKEN_2022_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
    };

    Object.keys(createLockInstructionAccounts).forEach((key) => {
      console.log(key, createLockInstructionAccounts[key].toBase58());
    });

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
            <div className="form-control">
              <label htmlFor="" className="label">
                <span className="label-text font-bold">Name</span>
              </label>
              <input
                type="text"
                className="input input-bordered input-sm"
                placeholder="Name the lock"
                maxLength={32}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setName(e.target.value)
                }
              />
            </div>

            {/* TODO: resolve .sol addresses and add validations */}
            <RecipientInput recipient={recipient} setRecipient={setRecipient} />

            {/* TODO: replace default image with "UNK" */}
            <SelectTokenInput
              assets={assets}
              amountToBeVested={+amountToBeVested}
              setAmountToBeVested={setAmountToBeVested}
              selectedToken={selectedToken}
              setSelectedToken={setSelectedToken}
            />

            {/* TODO: Dates are wonky, we need to include times and consider timezones */}
            <StartDateInput startDate={startDate} setStartDate={setStartDate} />

            {/* TODO: Dates are wonky, we need to include times and consider timezones */}
            <VestingDatesInput
              startDate={startDate}
              vestingEndDate={vestingEndDate}
              setVestingEndDate={setVestingEndDate}
            />

            <PayoutIntervalInput
              payoutInterval={payoutInterval}
              setPayoutInterval={setPayoutInterval}
            />

            {/* TODO: Consider bringing back the swith for this */}
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
          {/* TODO: I think the dates are still a little wonky here */}
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
