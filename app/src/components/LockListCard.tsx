import Link from "next/link";
import {
  FaUnlock,
  FaLock,
  FaCheckCircle,
  FaExclamationCircle,
  FaPlus,
  FaClock,
} from "react-icons/fa";
import { LockAccount } from "program/accounts";
import { Dispatch, SetStateAction } from "react";
import { getExplorerUrl } from "utils/explorer";
import Score from "./Score";
import PercentLocked from "./PercentLocked";
import Renounced from "./Renounced";

interface LockListCardProps {
  lock: LockAccount;
  setSelectedLock: Dispatch<SetStateAction<LockAccount>>;
}

export default function LockListCard({
  lock,
  setSelectedLock,
}: LockListCardProps) {
  return (
    <div key={lock.publicKey.toBase58()} className="card">
      <div className="card-body">
        <div className="flex items-center justify-between">
          <Link
            className="link link-secondary"
            href={getExplorerUrl(lock.endpoint, lock.publicKey)}
            target="_blank"
            rel="noopener noreferrer"
          >
            <h2 className="text-2xl font-bold flex gap-1 items-center">
              {/* @ts-ignore */}
              {lock.dasAsset.links?.image && (
                <img
                  // @ts-ignore
                  src={lock.dasAsset.links?.image || ""}
                  className="w-8 h-8 rounded-full"
                />
              )}

              {lock.displayPublicKey}
            </h2>
          </Link>

          <Score lock={lock} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Lock date */}
          <div className="flex flex-col gap-2">
            <span className="font-bold">Locked Date</span>
            <span>{lock.displayLockDate}</span>
          </div>

          {/* Unlock Date */}
          <div className="flex flex-col gap-2">
            <span className="font-bold">Unlock Date</span>
            <span>{lock.displayUnlockDate}</span>
          </div>

          {/* Mint */}
          <div className="flex flex-col gap-2">
            <span className="font-bold">Mint</span>
            <span>{lock.displayMint}</span>
          </div>

          <PercentLocked lock={lock} />

          <Renounced lock={lock} />

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <span className="font-bold">Actions</span>
            <div className="flex items-center gap-2">
              <div
                className="tooltip"
                data-tip="Deposit more tokens to the lock"
              >
                <button
                  className="btn btn-xs btn-circle"
                  onClick={() => {
                    setSelectedLock(lock);
                    document
                      .getElementById("deposit_to_lock_modal")
                      // @ts-ignore
                      .showModal();
                  }}
                >
                  <FaPlus />
                </button>
              </div>
              <div className="tooltip" data-tip="Extend the lock duration">
                <button
                  className="btn btn-xs btn-circle"
                  onClick={() => {
                    setSelectedLock(lock);
                    document
                      .getElementById("extend_lock_modal")
                      // @ts-ignore
                      .showModal();
                  }}
                >
                  <FaClock />
                </button>
              </div>
              <div className="tooltip" data-tip="Unlock the tokens">
                <button
                  disabled={!lock.canUnlock}
                  onClick={() => {
                    setSelectedLock(lock);
                    document
                      .getElementById("unlock_modal")
                      // @ts-ignore
                      .showModal();
                  }}
                  className="btn btn-xs btn-circle"
                >
                  <FaUnlock />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}