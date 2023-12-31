import Link from "next/link";
import { FaUnlock, FaPlus, FaClock, FaMinus } from "react-icons/fa";
import { LockAccount } from "program/accounts";
import { getExplorerUrl } from "utils/explorer";
import Score from "./Score";
import PercentLocked from "./PercentLocked";
import Renounced from "./Renounced";
import Image from "next/image";

interface LockListCardProps {
  lock: LockAccount;
}

export default function LockListCard({ lock }: LockListCardProps) {
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
              {/* @ts-expect-error dasAsset.links.image not defined on the type */}
              {lock.dasAsset?.links?.image ? (
                <img
                  // @ts-expect-error dasAsset.links.image not defined on the type
                  src={lock.dasAsset.links?.image || ""}
                  className="w-8 h-8 rounded-full"
                />
              ) : (
                <Image
                  className="w-8 h-8 rounded-full"
                  src="/LP.png"
                  width={32}
                  height={32}
                  alt="LP Token"
                />
              )}

              {lock.displayPublicKey}
            </h2>
          </Link>

          <Score
            lock={lock}
            lockSize="32"
            lockTextSize="xs"
            lockTextPosition="top-1/2 left-1/4"
          />
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
            <div className="flex items-center gap-1">
              <div
                className="tooltip"
                data-tip="Deposit more tokens to the lock"
              >
                <button
                  className="btn btn-xs btn-circle"
                  onClick={() => {
                    (
                      document.getElementById(
                        "deposit_to_lock_modal"
                      ) as HTMLDialogElement
                    ).showModal();
                  }}
                >
                  <FaPlus />
                </button>
              </div>
              {lock.canUnlock && (
                <div className="tooltip" data-tip="Withdraw tokens">
                  <button
                    onClick={() => {
                      (
                        document.getElementById(
                          "withdraw_to_beneficiary_modal"
                        ) as HTMLDialogElement
                      ).showModal();
                    }}
                    className="btn btn-xs btn-circle"
                  >
                    <FaMinus />
                  </button>
                </div>
              )}
              <div className="tooltip" data-tip="Extend the lock duration">
                <button
                  className="btn btn-xs btn-circle"
                  onClick={() => {
                    (
                      document.getElementById(
                        "extend_lock_modal"
                      ) as HTMLDialogElement
                    ).showModal();
                  }}
                >
                  <FaClock />
                </button>
              </div>
              {lock.canUnlock && (
                <div
                  className="tooltip"
                  data-tip="Withdraw all tokens and close the lock"
                >
                  <button
                    onClick={() => {
                      (
                        document.getElementById(
                          "close_lock_modal"
                        ) as HTMLDialogElement
                      ).showModal();
                    }}
                    className="btn btn-xs btn-circle"
                  >
                    <FaUnlock />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
