import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import LoadingSpinner from "components/LoadingSpinner";
import useProgram from "hooks/useProgram";
import Head from "next/head";
import Link from "next/link";
import { LockAccount, getLocksByUser } from "program/accounts";
import { useEffect, useState } from "react";
import {
  FaArrowAltCircleDown,
  FaArrowAltCircleUp,
  FaPlusCircle,
  FaSearch,
} from "react-icons/fa";
import useLocksStore from "stores/useLocksStore";

enum Tab {
  Beneficiary,
  Funder,
}

export default function Dashboard() {
  const today = new Date();
  const thirtyDays = new Date().setDate(today.getDate() + 30);
  const sixtyDays = new Date().setDate(today.getDate() + 60);
  const ninetyDays = new Date().setDate(today.getDate() + 90);
  const oneThousandYears = new Date().setFullYear(today.getFullYear() + 1000);

  const { wallet, balance, connection, program, connected } = useProgram();
  const { userLocks, setUserLocks } = useLocksStore();

  const [tab, setTab] = useState<Tab>(Tab.Beneficiary);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const getLocks = async (showLoadingSpinner: boolean, tab: Tab) => {
    setIsLoading(showLoadingSpinner);
    const theLocks = await getLocksByUser(
      connection,
      wallet.publicKey,
      program
    );
    setUserLocks(theLocks);
    setIsLoading(false);
  };

  useEffect(() => {
    if (program?.programId && wallet?.publicKey) {
      getLocks(userLocks && userLocks.length === 0, tab);
    } else {
      setUserLocks([]);
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
        <h1 className="font-bold">Dashboard</h1>

        {wallet.connected ? (
          <>
            <div className="flex items-center justify-between px-10">
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

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-9 lg:grid-cols-3 gap-2 md:gap-4 lg:gap-8 px-10 pb-10">
              <div className="stats stats-vertical hover:shadow md:col-span-4 lg:col-span-1">
                <div className="stat">
                  <button
                    className="stat-figure animate-pulse"
                    onClick={() => claimAll(userLocks)}
                  >
                    <FaArrowAltCircleDown className="text-success" size={24} />
                  </button>
                  <div className="stat-title">Claimable</div>
                  <div className="stat-value">$9,000</div>
                  <div className="stat-desc">As of Jan 1st</div>
                </div>

                <div className="stat">
                  <button
                    className="stat-figure"
                    onClick={() => disburseAll(userLocks)}
                  >
                    <FaArrowAltCircleUp className="text-info" size={24} />
                  </button>
                  <div className="stat-title">Disbursable</div>
                  <div className="stat-value">3/6</div>
                  <div className="stat-desc">Jan 1st - Jan 31st</div>
                </div>

                <div className="stat">
                  <button className="stat-figure text-secondary font-bold text-3xl">
                    ◎
                  </button>
                  <div className="stat-title">Wallet Balance</div>
                  <div className="stat-value">{balance.toLocaleString()}</div>
                  <div className="stat-desc">$1,200 (TODO)</div>
                </div>
              </div>

              {/* Locks */}
              <div className="md:col-span-5 lg:col-span-2">
                <div className="card hover:shadow h-full">
                  <div className="card-body min-h-80">
                    <div className="tabs tabs-boxed mb-8">
                      <div
                        className={`tab ${
                          tab === Tab.Beneficiary ? "tab-active" : ""
                        }`}
                        onClick={() => setTab(Tab.Beneficiary)}
                      >
                        Upcoming Unlocks
                      </div>
                      <div
                        className={`tab ${
                          tab === Tab.Funder ? "tab-active" : ""
                        }`}
                        onClick={() => setTab(Tab.Funder)}
                      >
                        Your Created Locks
                      </div>
                    </div>

                    {isLoading && <LoadingSpinner />}

                    {!isLoading && !userLocks.length && wallet?.publicKey && (
                      <div className="flex flex-col items-center gap-4">
                        <p className="prose">No locks created yet!</p>
                        <Link href="/create" className="btn btn-accent">
                          Create a lock
                        </Link>
                      </div>
                    )}

                    {!isLoading &&
                      userLocks.map((lock) => (
                        <div className="h-80 overflow-y-scroll">
                          <div key={lock.lockKey.toBase58()}>
                            {lock.lockKey.toBase58()}
                          </div>
                        </div>
                      ))}
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
