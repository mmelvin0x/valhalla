import BaseModel, {
  ScheduledPaymentAccount,
  TokenLockAccount,
  VestingScheduleAccount,
} from "models/models";
import { ScheduledPayment, TokenLock, VestingSchedule } from "program";
import { useEffect, useState } from "react";

import DashboardStats from "./ui/DashboardStats";
import Head from "next/head";
import LockCollapse from "components/dashboard/ui/LockCollapse";
import { SubType } from "utils/constants";
import { VestingType } from "program";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
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

  const getVestingSchedules = async () => {
    const funded = await VestingSchedule.gpaBuilder()
      .addFilter("vestingType", VestingType.VestingSchedule)
      .addFilter("funder", wallet.publicKey)
      .run(connection);

    const recipient = await VestingSchedule.gpaBuilder()
      .addFilter("vestingType", VestingType.VestingSchedule)
      .addFilter("recipient", wallet.publicKey)
      .run(connection);

    const fMapped = funded.map((v) => {
      const [vs] = VestingSchedule.fromAccountInfo(v.account);
      return new VestingScheduleAccount(v.pubkey, vs, connection);
    });

    const rMapped = recipient.map((v) => {
      const [vs] = VestingSchedule.fromAccountInfo(v.account);
      return new VestingScheduleAccount(v.pubkey, vs, connection);
    });

    setVestingSchedules({ funded: fMapped, recipient: rMapped });
  };

  const getTokenLocks = async () => {
    const funded = await TokenLock.gpaBuilder()
      .addFilter("vestingType", VestingType.TokenLock)
      .addFilter("funder", wallet.publicKey)
      .run(connection);

    const fMapped = funded.map((v) => {
      const [vs] = TokenLock.fromAccountInfo(v.account);
      return new TokenLockAccount(v.pubkey, vs, connection);
    });

    setTokenLocks({ funded: fMapped });
  };

  const getScheduledPayments = async () => {
    const funded = await ScheduledPayment.gpaBuilder()
      .addFilter("vestingType", VestingType.ScheduledPayment)
      .addFilter("funder", wallet.publicKey)
      .run(connection);

    const recipient = await ScheduledPayment.gpaBuilder()
      .addFilter("vestingType", VestingType.ScheduledPayment)
      .addFilter("recipient", wallet.publicKey)
      .run(connection);

    const fMapped = funded.map((v) => {
      const [vs] = ScheduledPayment.fromAccountInfo(v.account);
      return new ScheduledPaymentAccount(v.pubkey, vs, connection);
    });

    const rMapped = recipient.map((v) => {
      const [vs] = ScheduledPayment.fromAccountInfo(v.account);
      return new ScheduledPaymentAccount(v.pubkey, vs, connection);
    });

    setScheduledPayments({ funded: fMapped, recipient: rMapped });
  };

  useEffect(() => {
    if (!wallet.publicKey) return;
    getVestingSchedules();
    getTokenLocks();
    getScheduledPayments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallet.publicKey]);

  const [vestingType, setVestingType] = useState<VestingType>(
    VestingType.VestingSchedule,
  );
  const [subType, setSubType] = useState<SubType>(SubType.Created);

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
        <main className="grid grid-cols-12 gap-4">
          <div className="card col-span-9">
            <div className="card-body">
              <div className="card-title">Upcoming Releases</div>
            </div>
          </div>

          <DashboardStats />

          <div className="card col-span-12">
            <div className="card-body">
              <div className="card-title">All Accounts</div>
              <div className="tabs tabs-boxed">
                <div
                  onClick={() => setVestingType(VestingType.VestingSchedule)}
                  className={`tab flex items-center gap-1 ${vestingType === VestingType.VestingSchedule ? "tab-active" : ""}`}
                >
                  <div>Vesting Schedules</div>
                  <div className="badge badge-info">
                    {vestingSchedules.funded.length +
                      vestingSchedules.recipient.length}
                  </div>
                </div>

                <div
                  onClick={() => setVestingType(VestingType.ScheduledPayment)}
                  className={`tab flex items-center gap-1 ${vestingType === VestingType.ScheduledPayment ? "tab-active" : ""}`}
                >
                  <div>Scheduled Payments</div>
                  <div className="badge badge-info">
                    {scheduledPayments.funded.length +
                      scheduledPayments.recipient.length}
                  </div>
                </div>

                <div
                  onClick={() => setVestingType(VestingType.TokenLock)}
                  className={`tab flex items-center gap-1 ${vestingType === VestingType.TokenLock ? "tab-active" : ""}`}
                >
                  <div>Token Locks</div>
                  <div className="badge badge-info">
                    {tokenLocks.funded.length}
                  </div>
                </div>
              </div>

              <div className="tabs tabs-boxed">
                <div
                  onClick={() => setSubType(SubType.Created)}
                  className={`tab flex items-center gap-1 ${subType === SubType.Created ? "tab-active" : ""}`}
                >
                  <div>Created</div>
                  <div className="badge badge-info">
                    {vestingSchedules.funded.length}
                  </div>
                </div>

                <div
                  onClick={() =>
                    vestingType !== VestingType.TokenLock &&
                    setSubType(SubType.Receivable)
                  }
                  className={`tab flex items-center gap-1 ${subType === SubType.Receivable ? "tab-active" : ""} ${vestingType === VestingType.TokenLock ? "tab-disabled" : ""}`}
                >
                  <div>Receivable</div>
                  <div className="badge badge-info">
                    {scheduledPayments.recipient.length}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2">
                {vestingType === VestingType.VestingSchedule && (
                  <ul>
                    {subType === SubType.Created && (
                      <>
                        {vestingSchedules.funded.map((lock) => (
                          <li key={lock.id.toBase58()}>
                            <LockCollapse
                              lock={lock}
                              vestingType={vestingType}
                              disburse={async (lock: BaseModel) => {}}
                              changeRecipient={async (lock: BaseModel) => {}}
                              cancel={async (lock: BaseModel) => {}}
                            />
                          </li>
                        ))}
                      </>
                    )}

                    {subType === SubType.Receivable && (
                      <>
                        {vestingSchedules.recipient.map((lock) => (
                          <li key={lock.id.toBase58()}>
                            <LockCollapse
                              lock={lock}
                              vestingType={vestingType}
                              disburse={async (lock: BaseModel) => {}}
                              changeRecipient={async (lock: BaseModel) => {}}
                              cancel={async (lock: BaseModel) => {}}
                            />
                          </li>
                        ))}
                      </>
                    )}
                  </ul>
                )}

                {vestingType === VestingType.ScheduledPayment && (
                  <ul>
                    {subType === SubType.Created && (
                      <>
                        {scheduledPayments.funded.map((lock) => (
                          <li key={lock.id.toBase58()}>
                            <LockCollapse
                              lock={lock}
                              vestingType={vestingType}
                              disburse={async (lock: BaseModel) => {}}
                              changeRecipient={async (lock: BaseModel) => {}}
                              cancel={async (lock: BaseModel) => {}}
                            />
                          </li>
                        ))}
                      </>
                    )}

                    {subType === SubType.Receivable && (
                      <>
                        {scheduledPayments.recipient.map((lock) => (
                          <li key={lock.id.toBase58()}>
                            <LockCollapse
                              lock={lock}
                              vestingType={vestingType}
                              disburse={async (lock: BaseModel) => {}}
                              changeRecipient={async (lock: BaseModel) => {}}
                              cancel={async (lock: BaseModel) => {}}
                            />
                          </li>
                        ))}
                      </>
                    )}
                  </ul>
                )}

                {vestingType === VestingType.TokenLock && (
                  <ul>
                    {scheduledPayments.funded.map((lock) => (
                      <li key={lock.id.toBase58()}>
                        <LockCollapse
                          lock={lock}
                          vestingType={vestingType}
                          disburse={async (lock: BaseModel) => {}}
                          changeRecipient={async (lock: BaseModel) => {}}
                          cancel={async (lock: BaseModel) => {}}
                        />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
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
