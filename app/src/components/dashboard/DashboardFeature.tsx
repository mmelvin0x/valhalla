import BaseModel, {
  ScheduledPaymentAccount,
  TokenLockAccount,
  VestingScheduleAccount,
} from "models/models";
import { FormikHelpers, useFormik } from "formik";
import { ScheduledPayment, TokenLock, VestingSchedule } from "program";
import { useEffect, useMemo, useState } from "react";

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

  // TODO: Add dataslice for paging
  const getVestingSchedules = async () => {
    setLoading(true);
    try {
      const created = await VestingSchedule.gpaBuilder()
        .addFilter("vestingType", VestingType.VestingSchedule)
        .addFilter("creator", wallet.publicKey)
        .run(connection);

      const recipient = await VestingSchedule.gpaBuilder()
        .addFilter("vestingType", VestingType.VestingSchedule)
        .addFilter("recipient", wallet.publicKey)
        .run(connection);

      const fMapped = created.map((v) => {
        const [vs] = VestingSchedule.fromAccountInfo(v.account);
        return new VestingScheduleAccount(v.pubkey, vs, connection);
      });

      const rMapped = recipient.map((v) => {
        const [vs] = VestingSchedule.fromAccountInfo(v.account);
        return new VestingScheduleAccount(v.pubkey, vs, connection);
      });
      setVestingSchedules({ created: fMapped, recipient: rMapped });
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

  // TODO: Add dataslice for paging

  const totalTokenLocks = useMemo(() => {
    return tokenLocks.created.length;
  }, [tokenLocks.created]);

  const getTokenLocks = async () => {
    try {
      const created = await TokenLock.gpaBuilder()
        .addFilter("vestingType", VestingType.TokenLock)
        .addFilter("creator", wallet.publicKey)
        .run(connection);

      const fMapped = created.map((v) => {
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

  // TODO: Add dataslice for paging
  const totalScheduledPayments = useMemo(() => {
    return (
      scheduledPayments.created.length + scheduledPayments.recipient.length
    );
  }, [scheduledPayments.created, scheduledPayments.recipient]);

  const getScheduledPayments = async () => {
    try {
      const created = await ScheduledPayment.gpaBuilder()
        .addFilter("vestingType", VestingType.ScheduledPayment)
        .addFilter("creator", wallet.publicKey)
        .run(connection);

      const recipient = await ScheduledPayment.gpaBuilder()
        .addFilter("vestingType", VestingType.ScheduledPayment)
        .addFilter("recipient", wallet.publicKey)
        .run(connection);

      const fMapped = created.map((v) => {
        const [vs] = ScheduledPayment.fromAccountInfo(v.account);
        return new ScheduledPaymentAccount(v.pubkey, vs, connection);
      });

      const rMapped = recipient.map((v) => {
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

  useEffect(() => {
    if (!wallet.publicKey) return;
    getVestingSchedules();
    getTokenLocks();
    getScheduledPayments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallet.publicKey]);

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

  const onSearch = (
    values: { search: string },
    helpers: FormikHelpers<{ search: string }>,
  ) => {
    setLoading(true);
    setLoading(false);
  };

  const formik = useFormik({
    initialValues: { search: "" },
    validationSchema: dashboardSearchValidationSchema,
    onSubmit: onSearch,
  });

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
        <main className="grid gap-8">
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
              />
            </div>
          </div>

          {/* <AccountDetailsFeature /> */}
        </main>
      ) : (
        <main className="flex flex-col items-center gap-4">
          <p className="prose">Connect your wallet to get started</p>
          <WalletMultiButton />
        </main>
      )}
    </>
  );
}
