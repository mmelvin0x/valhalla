import BaseModel, {
  ScheduledPaymentAccount,
  TokenLockAccount,
  VestingScheduleAccount,
} from "models/models";
import {
  DisburseScheduledPaymentInstructionAccounts,
  DisburseTokenLockInstructionAccounts,
  DisburseVestingScheduleInstructionAccounts,
  ScheduledPayment,
  TokenLock,
  VestingSchedule,
  createCreateScheduledPaymentInstruction,
  createDisburseScheduledPaymentInstruction,
  createDisburseTokenLockInstruction,
  createDisburseVestingScheduleInstruction,
} from "program";
import { FormikHelpers, useFormik } from "formik";
import {
  SystemProgram,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import { getNameArg, shortenSignature } from "utils/formatters";
import { useEffect, useMemo, useState } from "react";

import { ASSOCIATED_TOKEN_PROGRAM_ID } from "@solana/spl-token";
import AccountList from "./ui/AccountList";
import DashboardStats from "./ui/DashboardStats";
import Head from "next/head";
import SearchInput from "./ui/SearchInput";
import { SubType } from "utils/constants";
import SubTypeTabs from "./ui/SubTypeTabs";
import { VestingType } from "program";
import VestingTypeTabs from "./ui/VestingTypeTabs";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { dashboardSearchValidationSchema } from "./utils/validationSchema";
import { notify } from "utils/notifications";
import useProgram from "program/useProgram";
import { useValhallaStore } from "stores/useValhallaStore";

export default function DashboardFeature() {
  const { wallet, connection } = useProgram();
  const {
    vestingSchedules,
    scheduledPayments,
    tokenLocks,
    setVestingSchedules,
    setScheduledPayments,
    setTokenLocks,
  } = useValhallaStore();

  const [loading, setLoading] = useState(false);
  const [currentList, setCurrentList] = useState<{
    created: BaseModel[];
    recipient: BaseModel[];
  }>({ created: [], recipient: [] });
  const [subType, setSubType] = useState<SubType>(SubType.Created);
  const [vestingType, setVestingType] = useState<VestingType>(
    VestingType.VestingSchedule,
  );

  const totalVestingSchedules = useMemo(() => {
    return vestingSchedules.created.length + vestingSchedules.recipient.length;
  }, [vestingSchedules.created, vestingSchedules.recipient]);
  const getVestingSchedules = async (search = "") => {
    setLoading(true);
    try {
      const created = await VestingSchedule.gpaBuilder()
        .addFilter("vestingType", VestingType.VestingSchedule)
        .addFilter("creator", wallet.publicKey);
      const recipient = await VestingSchedule.gpaBuilder()
        .addFilter("vestingType", VestingType.VestingSchedule)
        .addFilter("recipient", wallet.publicKey);

      if (search) {
        created.addFilter("name", getNameArg(search));
        recipient.addFilter("name", getNameArg(search));
      }

      const fMapped = (await created.run(connection)).map((v) => {
        const [vs] = VestingSchedule.fromAccountInfo(v.account);
        return new VestingScheduleAccount(v.pubkey, vs, connection);
      });
      const rMapped = (await recipient.run(connection)).map((v) => {
        const [vs] = VestingSchedule.fromAccountInfo(v.account);
        return new VestingScheduleAccount(v.pubkey, vs, connection);
      });

      setVestingSchedules({
        created: fMapped,
        recipient: rMapped,
      });
    } catch (e) {
      console.error(e);
      notify({
        message: "Error",
        description: "Failed to fetch vesting schedules",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const totalTokenLocks = useMemo(() => {
    return tokenLocks.created.length;
  }, [tokenLocks.created]);
  const getTokenLocks = async (search = "") => {
    try {
      const created = await TokenLock.gpaBuilder()
        .addFilter("vestingType", VestingType.TokenLock)
        .addFilter("creator", wallet.publicKey);

      if (search) {
        created.addFilter("name", getNameArg(search));
      }

      const fMapped = (await created.run(connection)).map((v) => {
        const [vs] = TokenLock.fromAccountInfo(v.account);
        return new TokenLockAccount(v.pubkey, vs, connection);
      });

      setTokenLocks({ created: fMapped });
    } catch (e) {
      console.error(e);
      notify({
        message: "Error",
        description: "Failed to fetch token locks",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const totalScheduledPayments = useMemo(() => {
    return (
      scheduledPayments.created.length + scheduledPayments.recipient.length
    );
  }, [scheduledPayments.created, scheduledPayments.recipient]);
  const getScheduledPayments = async (search = "") => {
    try {
      const created = await VestingSchedule.gpaBuilder()
        .addFilter("vestingType", VestingType.ScheduledPayment)
        .addFilter("creator", wallet.publicKey);
      const recipient = await VestingSchedule.gpaBuilder()
        .addFilter("vestingType", VestingType.ScheduledPayment)
        .addFilter("recipient", wallet.publicKey);

      if (search) {
        created.addFilter("name", getNameArg(search));
        recipient.addFilter("name", getNameArg(search));
      }

      const fMapped = (await created.run(connection)).map((v) => {
        const [vs] = ScheduledPayment.fromAccountInfo(v.account);
        return new ScheduledPaymentAccount(v.pubkey, vs, connection);
      });

      const rMapped = (await created.run(connection)).map((v) => {
        const [vs] = ScheduledPayment.fromAccountInfo(v.account);
        return new ScheduledPaymentAccount(v.pubkey, vs, connection);
      });

      setScheduledPayments({ created: fMapped, recipient: rMapped });
    } catch (e) {
      console.error(e);
      notify({
        message: "Error",
        description: "Failed to fetch scheduled payments",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  // Grabs the locks for the user
  // TODO: Add dataslice for paging
  useEffect(() => {
    if (!wallet.publicKey) return;
    getVestingSchedules();
    getTokenLocks();
    getScheduledPayments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallet.publicKey]);

  // Sets the current list based on the vesting type
  useEffect(() => {
    switch (vestingType) {
      case VestingType.VestingSchedule:
        setCurrentList({
          created: vestingSchedules.created,
          recipient: vestingSchedules.recipient,
        });
        break;
      case VestingType.TokenLock:
        setCurrentList({ created: tokenLocks.created, recipient: [] });
        break;
      case VestingType.ScheduledPayment:
        setCurrentList({
          created: scheduledPayments.created,
          recipient: scheduledPayments.recipient,
        });
        break;

      default:
        setCurrentList({ created: [], recipient: [] });
        break;
    }
  }, [
    scheduledPayments.created,
    scheduledPayments.recipient,
    subType,
    tokenLocks.created,
    vestingSchedules.created,
    vestingSchedules.recipient,
    vestingType,
  ]);

  const onSearch = async (
    values: { search: string },
    helpers: FormikHelpers<{ search: string }>,
  ) => {
    setLoading(true);
    setVestingSchedules({ created: [], recipient: [] });
    setTokenLocks({ created: [] });
    setScheduledPayments({ created: [], recipient: [] });

    await getVestingSchedules(values.search);
    await getTokenLocks(values.search);
    await getScheduledPayments(values.search);

    setLoading(false);
  };

  const formik = useFormik({
    initialValues: { search: "" },
    validationSchema: dashboardSearchValidationSchema,
    onSubmit: onSearch,
  });

  const disburse = async (lock: BaseModel) => {
    let accounts:
      | DisburseVestingScheduleInstructionAccounts
      | DisburseTokenLockInstructionAccounts
      | DisburseScheduledPaymentInstructionAccounts;
    let disburseIx: TransactionInstruction;
    switch (lock.vestingType) {
      case VestingType.VestingSchedule:
        accounts = {
          signer: wallet.publicKey,
          creator: lock.creator,
          recipient: lock.recipient,
          vestingSchedule: lock.id,
          vestingScheduleTokenAccount: lock.tokenAccount.address,
          recipientTokenAccount: lock.recipientTokenAccount.address,
          mint: lock.tokenAccount.mint,
          tokenProgram: lock.tokenProgramId,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        };

        disburseIx = createDisburseVestingScheduleInstruction(accounts);

        break;

      case VestingType.TokenLock:
        accounts = {
          creator: lock.creator,
          creatorTokenAccount: lock.creatorTokenAccount.address,
          tokenLock: lock.id,
          tokenLockTokenAccount: lock.tokenAccount.address,
          mint: lock.tokenAccount.mint,
          tokenProgram: lock.tokenAccount.owner,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        };

        disburseIx = createDisburseTokenLockInstruction(accounts);

        break;

      case VestingType.ScheduledPayment:
        accounts = {
          signer: wallet.publicKey,
          creator: lock.creator,
          recipient: lock.recipient,
          recipientTokenAccount: lock.recipientTokenAccount.address,
          scheduledPayment: lock.id,
          paymentTokenAccount: lock.tokenAccount.address,
          mint: lock.tokenAccount.mint,
          tokenProgram: lock.tokenAccount.owner,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        };

        disburseIx = createDisburseScheduledPaymentInstruction(accounts);

        break;
    }

    const latestBlockhash = await connection.getLatestBlockhash();
    const messageV0 = new TransactionMessage({
      payerKey: wallet.publicKey,
      recentBlockhash: latestBlockhash.blockhash,
      instructions: [disburseIx],
    }).compileToV0Message();

    try {
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
    } catch (error) {
      console.error(error);
      notify({
        message: "Transaction Failed",
        description: `Transaction failed`,
        type: "error",
      });
    }
  };

  const changeRecipient = async (lock: BaseModel) => {};

  const cancel = async (lock: BaseModel) => {};

  const close = async (lock: BaseModel) => {};

  return (
    <>
      <Head>
        <title>Valhalla | Token Vesting Solutions</title>
        <meta
          name="description"
          content="Token Vesting and Locks on Solana. Lock your tokens until Valhalla."
        />
      </Head>

      {wallet.connected ? (
        <main className="grid grid-cols-1 gap-8 m-8">
          <DashboardStats />

          <div className="card">
            <div className="card-body">
              <div className="card-title justify-between">
                <span className="flex-1">Accounts</span>
                <SearchInput formik={formik} />
              </div>

              <VestingTypeTabs
                vestingType={vestingType}
                setVestingType={setVestingType}
                totalVestingSchedules={totalVestingSchedules}
                totalScheduledPayments={totalScheduledPayments}
                totalTokenLocks={totalTokenLocks}
              />

              <SubTypeTabs
                subType={subType}
                setSubType={setSubType}
                vestingType={vestingType}
                list={currentList}
              />

              <AccountList
                loading={loading}
                vestingType={vestingType}
                subType={subType}
                vestingSchedules={vestingSchedules}
                scheduledPayments={scheduledPayments}
                tokenLocks={tokenLocks}
                disburse={disburse}
                changeRecipient={changeRecipient}
                cancel={cancel}
                close={close}
              />
            </div>
          </div>

          {/* <AccountDetailsFeature /> */}
        </main>
      ) : (
        <main className="flex flex-col items-center gap-4 m-8">
          <p className="prose">Connect your wallet to get started</p>
          <WalletMultiButton />
        </main>
      )}
    </>
  );
}
