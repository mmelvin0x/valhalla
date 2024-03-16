import { FormikHelpers, useFormik } from "formik";
import {
  disburseScheduledPaymentInstruction,
  disburseTokenLockInstruction,
  disburseVestingScheduleInstruction,
} from "components/dashboard/instructions/disburse";
import {
  searchScheduledPayments,
  searchTokenLocks,
  searchVaults,
} from "utils/search";
import { useEffect, useMemo, useState } from "react";

import AccountList from "./ui/AccountList";
import BaseModel from "models/models";
import DashboardStats from "./ui/DashboardStats";
import Head from "next/head";
import SearchInput from "./ui/SearchInput";
import { SubType } from "utils/constants";
import SubTypeTabs from "./ui/SubTypeTabs";
import { TransactionInstruction } from "@solana/web3.js";
import { VestingType } from "program";
import VestingTypeTabs from "./ui/VestingTypeTabs";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { dashboardSearchValidationSchema } from "./utils/validationSchema";
import { notify } from "utils/notifications";
import { sendTransaction } from "utils/sendTransaction";
import { shortenSignature } from "utils/formatters";
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
      const { created, recipient } = await searchVaults(
        connection,
        wallet.publicKey,
        search,
      );

      setVestingSchedules({
        created,
        recipient,
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
      const { created } = await searchTokenLocks(
        connection,
        wallet.publicKey,
        search,
      );

      setTokenLocks({ created });
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
      const { created: fMapped, recipient: rMapped } =
        await searchScheduledPayments(connection, wallet.publicKey, search);

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
    let instruction: TransactionInstruction;
    switch (lock.vestingType) {
      case VestingType.VestingSchedule:
        instruction = disburseVestingScheduleInstruction(
          wallet.publicKey,
          lock,
        );

        break;

      case VestingType.TokenLock:
        instruction = disburseTokenLockInstruction(lock);

        break;

      case VestingType.ScheduledPayment:
        instruction = disburseScheduledPaymentInstruction(
          wallet.publicKey,
          lock,
        );

        break;
    }

    try {
      const txid = await sendTransaction(connection, wallet, [instruction]);
      notify({
        message: "Transaction sent",
        description: `Transaction ${shortenSignature(txid)} has been sent`,
        type: "success",
      });
    } catch (error) {
      console.error(error);
      notify({
        message: "Transaction Failed",
        description: error.message,
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
