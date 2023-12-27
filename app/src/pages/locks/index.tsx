import { FC, useEffect, useMemo, useState } from "react";
import useProgram from "hooks/useProgram";
import { PublicKey } from "@solana/web3.js";
import BN from "bn.js";
import { shortenAddress, shortenNumber } from "utils/formatters";
import { FaLink } from "react-icons/fa";
import Link from "next/link";
import { getExplorerUrl } from "utils/explorer";
import { LockAccount, getAllLocks } from "program/accounts";
import Score from "components/Score";
import Renounced from "components/Renounced";
import LoadingSpinner from "components/LoadingSpinner";

const Locks: FC = () => {
  const { program, connection } = useProgram();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [locks, setLocks] = useState<LockAccount[]>([]);
  const [search, setSearch] = useState<string>("");

  const getLocks = async () => {
    setIsLoading(true);
    const theLocks = await getAllLocks(connection, program, search);
    setLocks(theLocks);
    setIsLoading(false);
  };

  useEffect(() => {
    if (program?.programId) {
      getLocks();
    }
  }, []);

  return (
    <div className="flex flex-col gap-8 items-center justify-center py-10">
      <h1 className="text-6xl font-bold relative">Locks</h1>

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
          onClick={() => search && getLocks()}
        >
          Search
        </button>
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <div className="overflow-x-auto">
          <table className="table">
            {/* head */}
            <thead>
              <tr>
                <th>Score</th>
                <th>Symbol</th>
                <th>Name</th>
                <th>Renounced</th>
                <th>Lock Date</th>
                <th>Unlock Date</th>
                <th>% Locked</th>
              </tr>
            </thead>
            <tbody>
              {!locks.length && (
                <p className="prose text-center my-8">No locks found.</p>
              )}

              {locks.map((lock) => (
                <tr
                  key={lock.publicKey.toBase58()}
                  className="hover cursor-pointer"
                >
                  <td>
                    <Score lock={lock} tooltipDirection={"tooltip-right"} />
                  </td>
                  <td>{lock.dasAsset.metadata.symbol}</td>
                  <td>{lock.dasAsset.metadata.name}</td>
                  <td>
                    <Renounced lock={lock} showTitle={false} />
                  </td>
                  <td>{lock.displayLockDate}</td>
                  <td>{lock.displayUnlockDate}</td>
                  <td>{lock.displayPercentLocked}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Locks;
