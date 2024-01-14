import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import LoadingSpinner from "components/LoadingSpinner";
import useProgram from "hooks/useProgram";
import Head from "next/head";
import Link from "next/link";
import { Lock } from "program/generated";
import { useEffect, useState } from "react";
import { FaPlusCircle, FaSearch } from "react-icons/fa";
import useLocksStore from "stores/useLocksStore";
import { useDates } from "hooks/useDates";
import { LockAccount } from "models/types";
import DashboardStats from "components/dashboard/DashboardStats";
import LockCollapse from "components/dashboard/LockCollapse";

enum Tab {
  Recipient,
  Funder,
}

export default function Dashboard() {
  const { today } = useDates();
  const { wallet, balance, connection, program, connected } = useProgram();
  const {
    userFunderLocks,
    setUserFunderLocks,
    userRecipientLocks,
    setUserRecipientLocks,
  } = useLocksStore();

  const [tab, setTab] = useState<Tab>(Tab.Recipient);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const getFunderLocks = async () => {
    const locksWhereUserIsFunder = await Lock.gpaBuilder()
      .addFilter("funder", wallet.publicKey)
      .run(connection);
    console.log(
      "-> ~ getFunderLocks ~ locksWhereUserIsFunder:",
      locksWhereUserIsFunder
    );

    const funderLocks = locksWhereUserIsFunder.map(
      (it) =>
        new LockAccount(
          Lock.fromAccountInfo(it.account)[0],
          it.pubkey,
          connection
        )
    );

    console.log(funderLocks);

    setUserFunderLocks(funderLocks);
  };

  const getRecipientLocks = async () => {
    const locksWhereUserIsRecipient = await Lock.gpaBuilder()
      .addFilter("recipient", wallet.publicKey)
      .run(connection);

    const recipientLocks = locksWhereUserIsRecipient.map(
      (it) =>
        new LockAccount(
          Lock.fromAccountInfo(it.account)[0],
          it.pubkey,
          connection
        )
    );

    console.log(recipientLocks);

    setUserRecipientLocks(recipientLocks);
  };

  const getLocks = async (showLoadingSpinner: boolean) => {
    setIsLoading(showLoadingSpinner);
    await getFunderLocks();
    await getRecipientLocks();
    setIsLoading(false);
  };

  useEffect(() => {
    if (
      wallet?.publicKey &&
      connected &&
      (!userFunderLocks?.length || !userRecipientLocks?.length)
    ) {
      getLocks(
        (userFunderLocks && userFunderLocks.length === 0) ||
          (userRecipientLocks && userRecipientLocks.length === 0)
      );
    } else {
      setUserFunderLocks([]);
      setUserRecipientLocks([]);
    }
  }, [connected, tab]);

  const claim = async (lockAcount: LockAccount) => {
    alert("Implement: Claim");
  };

  const claimAll = async (lockAccounts: LockAccount[]) => {
    alert("Implement: Claim all");
  };

  const disburse = async (lockAcount: LockAccount) => {
    alert("Implement: Disburse");
  };

  const disburseAll = async (lockAccounts: LockAccount[]) => {
    alert("Implement: Disburse all");
  };

  const cancel = async (lockAcount: LockAccount) => {
    alert("Implement: Cancel");
  };

  const changeRecipient = async (lockAcount: LockAccount) => {
    alert("Implement: Change recipient");
  };

  return (
    <>
      <Head>
        <title>Valhalla | Token Vesting Solutions</title>
        <meta
          name="description"
          content="Token Vesting and Locks on Solana. Lock your tokens until Valhalla."
        />
      </Head>

      <main className="flex flex-col gap-8 justify-center">
        {wallet.connected ? (
          <>
            <div className="flex flex-wrap items-center justify-between">
              <h2 className="text-3xl font-bold">Your Vestments</h2>
              <div className="flex gap-2">
                <Link href="/search" className="btn btn-secondary">
                  <FaSearch /> Search
                </Link>

                <Link href={"/create"} className="btn btn-accent">
                  <FaPlusCircle /> Create a Lock
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <DashboardStats claimAll={claimAll} disburseAll={disburseAll} />

              {/* Locks */}
              <div className="card hover:shadow h-full md:col-span-2">
                <div className="card-body min-h-80">
                  <div className="tabs tabs-boxed mb-8">
                    <div
                      className={`tab ${
                        tab === Tab.Recipient ? "tab-active" : ""
                      }`}
                      onClick={() => setTab(Tab.Recipient)}
                    >
                      Claim
                    </div>
                    <div
                      className={`tab ${
                        tab === Tab.Funder ? "tab-active" : ""
                      }`}
                      onClick={() => setTab(Tab.Funder)}
                    >
                      Disburse
                    </div>
                  </div>

                  <div className="h-80 overflow-y-scroll">
                    {isLoading ? (
                      <div className="flex flex-col w-full h-full items-center justify-center">
                        <LoadingSpinner />
                      </div>
                    ) : (
                      <>
                        {tab === Tab.Funder && (
                          <>
                            {wallet.publicKey && !!userFunderLocks.length ? (
                              userFunderLocks.map((lock, i) => (
                                <LockCollapse
                                  index={i}
                                  lock={lock}
                                  disburse={disburse}
                                  cancel={cancel}
                                  changeRecipient={changeRecipient}
                                />
                              ))
                            ) : (
                              <div className="flex flex-col items-center gap-4">
                                <p className="prose">No funded accounts!</p>
                                <Link href="/create" className="btn btn-accent">
                                  <FaPlusCircle className="inline" />
                                  Create a lock
                                </Link>
                              </div>
                            )}
                          </>
                        )}

                        {tab === Tab.Recipient && (
                          <>
                            {wallet.publicKey && !!userRecipientLocks.length ? (
                              userRecipientLocks.map((lock, i) => (
                                <LockCollapse
                                  index={i}
                                  lock={lock}
                                  disburse={disburse}
                                  cancel={cancel}
                                  changeRecipient={changeRecipient}
                                />
                              ))
                            ) : (
                              <div className="flex flex-col items-center gap-4">
                                <p className="prose">No receivable accounts!</p>
                                <Link href="/create" className="btn btn-accent">
                                  <FaPlusCircle className="inline" />
                                  Create a lock
                                </Link>
                              </div>
                            )}
                          </>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <p className="prose">Connect your wallet to get started</p>
            <WalletMultiButton />
          </div>
        )}
      </main>
    </>
  );
}
