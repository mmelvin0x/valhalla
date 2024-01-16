import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import LoadingSpinner from "components/LoadingSpinner";
import useProgram from "hooks/useProgram";
import Head from "next/head";
import Link from "next/link";
import { ChangeEvent, useCallback, useEffect, useState } from "react";
import { FaPlusCircle, FaSearch } from "react-icons/fa";
import useLocksStore from "stores/useLocksStore";
import { LockAccount } from "models/Lock";
import DashboardStats from "components/dashboard/DashboardStats";
import LockCollapse from "components/dashboard/LockCollapse";
import { Lock } from "program/solita/accounts/Lock";
import { getNameArg } from "utils/formatters";
import { Tab } from "../utils/constants";

export default function Dashboard() {
  const { wallet, connection, connected } = useProgram();
  const {
    userFunderLocks,
    setUserFunderLocks,
    userRecipientLocks,
    setUserRecipientLocks,
  } = useLocksStore();

  const [tab, setTab] = useState<Tab>(Tab.Recipient);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [nameSearch, setNameSearch] = useState<string>("");

  const onNameSearch = async (e: ChangeEvent<HTMLInputElement>) => {
    console.log("Searching for name", e.target.value);
    setNameSearch(e.target.value);
    setIsLoading(true);
    const locksWithName = await Lock.gpaBuilder()
      .addFilter("name", getNameArg(e.target.value))
      .run(connection);

    const locks = locksWithName.map(
      (it) =>
        new LockAccount(
          Lock.fromAccountInfo(it.account)[0],
          it.pubkey,
          connection,
        ),
    );

    if (tab === Tab.Funder) {
      setUserFunderLocks(locks);
    } else {
      setUserRecipientLocks(locks);
    }

    setIsLoading(false);
  };

  const getFunderLocks = useCallback(async () => {
    console.log("Getting funder locks");
    const locksWhereUserIsFunder = await Lock.gpaBuilder()
      .addFilter("funder", wallet.publicKey)
      .run(connection);

    const funderLocks = locksWhereUserIsFunder.map(
      (it) =>
        new LockAccount(
          Lock.fromAccountInfo(it.account)[0],
          it.pubkey,
          connection,
        ),
    );

    setUserFunderLocks(funderLocks);
  }, [connection, setUserFunderLocks, wallet.publicKey]);

  const getRecipientLocks = useCallback(async () => {
    console.log("Getting recipient locks");
    const locksWhereUserIsRecipient = await Lock.gpaBuilder()
      .addFilter("recipient", wallet.publicKey)
      .run(connection);

    const recipientLocks = locksWhereUserIsRecipient.map(
      (it) =>
        new LockAccount(
          Lock.fromAccountInfo(it.account)[0],
          it.pubkey,
          connection,
        ),
    );

    setUserRecipientLocks(recipientLocks);
  }, [connection, setUserRecipientLocks, wallet.publicKey]);

  useEffect(() => {
    const getLocks = async (showLoadingSpinner: boolean) => {
      setIsLoading(showLoadingSpinner);
      await getFunderLocks();
      await getRecipientLocks();
      setIsLoading(false);
    };

    if (
      wallet?.publicKey &&
      connected &&
      (!userFunderLocks?.length || !userRecipientLocks?.length)
    ) {
      getLocks(
        (userFunderLocks && userFunderLocks.length === 0) ||
          (userRecipientLocks && userRecipientLocks.length === 0),
      );
    } else {
      setUserFunderLocks([]);
      setUserRecipientLocks([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected, tab, wallet?.publicKey]);

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

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <DashboardStats claimAll={claimAll} disburseAll={disburseAll} />

              {/* Locks */}
              <div className="card hover:shadow h-full md:col-span-3">
                <div className="card-body min-h-80">
                  <div className="tabs tabs-boxed">
                    <div
                      className={`tab ${
                        tab === Tab.Recipient ? "tab-active" : ""
                      }`}
                      onClick={() => setTab(Tab.Recipient)}
                    >
                      Receivable
                    </div>
                    <div
                      className={`tab ${
                        tab === Tab.Funder ? "tab-active" : ""
                      }`}
                      onClick={() => setTab(Tab.Funder)}
                    >
                      Funded by me
                    </div>
                  </div>

                  <div className="h-80 overflow-y-scroll">
                    <div className="form-control my-2">
                      <input
                        type="text"
                        className="input input-bordered input-sm"
                        placeholder="Search by name"
                        value={nameSearch}
                        onChange={onNameSearch}
                      />
                    </div>
                    {isLoading ? (
                      <div className="flex flex-col w-full h-full items-center justify-center">
                        <LoadingSpinner />
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {tab === Tab.Funder && (
                          <>
                            {wallet.publicKey && !!userFunderLocks.length ? (
                              <ul>
                                {userFunderLocks.map((lock) => (
                                  <LockCollapse
                                    key={lock.id.toBase58()}
                                    tab={tab}
                                    lock={lock}
                                    disburse={disburse}
                                    cancel={cancel}
                                    changeRecipient={changeRecipient}
                                  />
                                ))}
                              </ul>
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
                              <ul>
                                {userRecipientLocks.map((lock) => (
                                  <LockCollapse
                                    key={lock.id.toBase58()}
                                    tab={tab}
                                    lock={lock}
                                    disburse={disburse}
                                    cancel={cancel}
                                    changeRecipient={changeRecipient}
                                  />
                                ))}
                              </ul>
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
                      </div>
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
