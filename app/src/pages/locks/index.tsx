import { FC, useEffect, useState } from "react";
import useProgram from "hooks/useProgram";
import { LockAccount, getAllLocks } from "program/accounts";
import Score from "components/Score";
import Renounced from "components/Renounced";
import LoadingSpinner from "components/LoadingSpinner";
import { useRouter } from "next/router";
import useLocksStore from "stores/useLocksStore";

const Locks: FC = () => {
  const router = useRouter();
  const { program, connection } = useProgram();
  const { locks, setLocks, setSelectedLock } = useLocksStore();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [search, setSearch] = useState<string>("");

  const onLockSelect = (lock: LockAccount) => {
    setSelectedLock(lock);
    router.push(`/locks/${lock.publicKey.toBase58()}`);
  };

  const getLocks = async (showLoadingSpinner: boolean) => {
    setIsLoading(showLoadingSpinner);
    const theLocks = await getAllLocks(connection, program, search);
    setLocks(theLocks);
    setIsLoading(false);
  };

  useEffect(() => {
    if (program?.programId) {
      getLocks(locks && locks.length === 0);
    }
  }, []);

  return (
    <div className="flex flex-col gap-8 items-center justify-center py-10">
      <h1 className="text-5xl font-bold relative">Locks</h1>

      <div className="flex items-center gap-2">
        <div className="form-control">
          <input
            type="text"
            placeholder="Search by mint address"
            className="input input-bordered"
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <button
          className="btn btn-primary"
          onClick={() => search && getLocks(true)}
        >
          Search
        </button>
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <>
          {!locks.length ? (
            <p className="prose text-center my-8">No locks found.</p>
          ) : (
            <>
              <div className="hidden md:block h-full overflow-x-scroll">
                <table className="table bg-base-100">
                  {/* head */}
                  <thead>
                    <tr>
                      <th>Score</th>
                      <th>Symbol</th>
                      <th className="">Name</th>
                      <th>Renounced</th>
                      <th className="">Lock Date</th>
                      <th>Unlock Date</th>
                      <th className="">% Locked</th>
                    </tr>
                  </thead>
                  <tbody>
                    {locks.map((lock) => (
                      <tr
                        key={lock.publicKey.toBase58()}
                        className="hover cursor-pointer"
                        onClick={() => onLockSelect(lock)}
                      >
                        <td>
                          <Score
                            lock={lock}
                            tooltipDirection={"tooltip-right"}
                            lockSize="32"
                            lockTextSize="xs"
                            lockTextPosition="top-1/2 left-1/4"
                          />
                        </td>
                        <td>{lock.dasAsset?.metadata.symbol || "UNK"}</td>
                        <td className="">
                          {lock.dasAsset?.metadata.name || "Unknown"}
                        </td>
                        <td>
                          <Renounced lock={lock} showTitle={false} />
                        </td>
                        <td className="">{lock.displayLockDate}</td>
                        <td>{lock.displayUnlockDate}</td>
                        <td className="">{lock.displayPercentLocked}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="md:hidden overflow-x-scroll">
                <table className="table bg-base-100">
                  {/* head */}
                  <thead>
                    <tr>
                      <th>Score</th>
                      <th>Symbol</th>
                      <th>Renounced</th>
                      <th>Unlock Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {locks.map((lock) => (
                      <tr
                        key={lock.publicKey.toBase58()}
                        className="hover cursor-pointer"
                        onClick={() => onLockSelect(lock)}
                      >
                        <td>
                          <Score
                            lock={lock}
                            tooltipDirection={"tooltip-right"}
                            lockSize="32"
                            lockTextSize="xs"
                            lockTextPosition="top-1/2 left-1/4"
                          />
                        </td>
                        <td>{lock.dasAsset?.metadata.symbol || "UNK"}</td>
                        <td>
                          <Renounced lock={lock} showTitle={false} />
                        </td>
                        <td>{lock.displayUnlockDate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default Locks;
