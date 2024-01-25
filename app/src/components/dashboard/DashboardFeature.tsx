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
import { getNameArg } from "utils/formatters";
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

  const disburse = async (lock: BaseModel) => {};

  const changeRecipient = async (lock: BaseModel) => {};

  const cancel = async (lock: BaseModel) => {};

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
                disburse={disburse}
                changeRecipient={changeRecipient}
                cancel={cancel}
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
