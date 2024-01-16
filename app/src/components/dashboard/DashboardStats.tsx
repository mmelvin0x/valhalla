import * as anchor from "@coral-xyz/anchor";
import { LockAccount } from "models/Lock";
import useProgram from "program/useProgram";
import { useMemo } from "react";
import { FaArrowAltCircleDown, FaArrowAltCircleUp } from "react-icons/fa";
import useLocksStore from "stores/useLocksStore";

export default function DashboardStats({
  claimAll,
  disburseAll,
}: {
  claimAll: (locks: LockAccount[]) => Promise<void>;
  disburseAll: (locks: LockAccount[]) => Promise<void>;
}) {
  const { balance } = useProgram();
  const { userRecipientLocks, userFunderLocks } = useLocksStore();

  const hasClaimableLocks = useMemo(() => {
    const currentTimestamp = new anchor.BN(Math.floor(Date.now() / 1000));
    return userRecipientLocks.some((lock) => {
      const lastPaymentTimestamp = lock.lastPaymentTimestamp;
      const payoutInterval = lock.payoutInterval;
      const timeSinceLastPayment = currentTimestamp.sub(lastPaymentTimestamp);

      return timeSinceLastPayment.gte(payoutInterval);
    });
  }, [userRecipientLocks]);

  const totalLocksClaimable = useMemo(() => {
    return userRecipientLocks.reduce((acc, lock) => {
      const lastPaymentTimestamp = lock.lastPaymentTimestamp;
      const payoutInterval = lock.payoutInterval;
      const timeSinceLastPayment = new anchor.BN(
        Math.round(Date.now() / 1000),
      ).sub(lastPaymentTimestamp);

      if (timeSinceLastPayment.gte(payoutInterval)) {
        return acc + 1;
      }

      return acc;
    }, 0);
  }, [userRecipientLocks]);

  const hasDisbursableLocks = useMemo(() => {
    const currentTimestamp = new anchor.BN(Math.floor(Date.now() / 1000));
    return userFunderLocks.some((lock) => {
      const lastPaymentTimestamp = lock.lastPaymentTimestamp;
      const payoutInterval = lock.payoutInterval;
      const timeSinceLastPayment = currentTimestamp.sub(lastPaymentTimestamp);

      return timeSinceLastPayment.gte(payoutInterval);
    });
  }, [userFunderLocks]);

  const totalLocksDisbursable = useMemo(() => {
    return userFunderLocks.reduce((acc, lock) => {
      const lastPaymentTimestamp = lock.lastPaymentTimestamp;
      const payoutInterval = lock.payoutInterval;
      const timeSinceLastPayment = new anchor.BN(
        Math.round(Date.now() / 1000),
      ).sub(lastPaymentTimestamp);

      if (timeSinceLastPayment.gte(payoutInterval)) {
        return acc + 1;
      }

      return acc;
    }, 0);
  }, [userFunderLocks]);

  // TODO: This seems off
  const earliestClaimableLockDate = useMemo(() => {
    const earliestLock = userRecipientLocks.reduce((acc, lock) => {
      const lastPaymentTimestamp =
        lock.lastPaymentTimestampAsNumberInMilliseconds;
      const payoutInterval = lock.payoutIntervalAsNumberInMilliseconds;
      const timeSinceLastPayment = Date.now() - lastPaymentTimestamp;

      if (timeSinceLastPayment >= payoutInterval) {
        if (acc === null) {
          return lock;
        }

        if (
          lastPaymentTimestamp < lock.lastPaymentTimestampAsNumberInMilliseconds
        ) {
          return lock;
        }
      }

      return acc;
    }, null);

    if (earliestLock) {
      return `Earliest Claim: ${new Date(
        earliestLock.lastPaymentTimestampAsNumberInMilliseconds,
      ).toLocaleString()}`;
    }

    return "No locks available to claim";
  }, [userRecipientLocks]);

  // TODO: This seems off
  const earliestDisbursableLockDate = useMemo(() => {
    const earliestLock = userFunderLocks.reduce((acc, lock) => {
      const lastPaymentTimestamp =
        lock.lastPaymentTimestampAsNumberInMilliseconds;
      const payoutInterval = lock.payoutIntervalAsNumberInMilliseconds;
      const timeSinceLastPayment = Date.now() - lastPaymentTimestamp;

      if (timeSinceLastPayment >= payoutInterval) {
        if (acc === null) {
          return lock;
        }

        if (
          lastPaymentTimestamp < lock.lastPaymentTimestampAsNumberInMilliseconds
        ) {
          return lock;
        }
      }

      return acc;
    }, null);

    if (earliestLock) {
      return `Earliest Unlock: ${new Date(
        earliestLock.lastPaymentTimestampAsNumberInMilliseconds,
      ).toLocaleString()}`;
    }

    return "No locks available to disburse";
  }, [userFunderLocks]);

  return (
    <div className="stats stats-vertical hover:shadow">
      <div className="stat">
        {hasClaimableLocks && (
          <button
            className={`stat-figure animate-pulse`}
            onClick={() => claimAll(userRecipientLocks)}
          >
            <FaArrowAltCircleDown className={`text-success`} size={48} />
          </button>
        )}
        <div className="stat-title">Claimable</div>
        <div className="stat-value">
          {userRecipientLocks.length === 0
            ? "None"
            : `${totalLocksClaimable} / ${userRecipientLocks.length}`}
        </div>
        <div className="stat-desc">{earliestClaimableLockDate || "wtf"}</div>
      </div>

      <div className="stat">
        {hasDisbursableLocks && (
          <button
            className="stat-figure animate-pulse"
            onClick={() => disburseAll(userRecipientLocks)}
          >
            <FaArrowAltCircleUp className="text-info" size={48} />
          </button>
        )}
        <div className="stat-title">Disbursable</div>
        <div className="stat-value">
          {userFunderLocks.length === 0
            ? "None"
            : `${totalLocksDisbursable} / ${userFunderLocks.length}`}
        </div>
        <div className="stat-desc">{earliestDisbursableLockDate || "wtf"}</div>
      </div>

      <div className="stat">
        <div className="stat-title">Wallet Balance</div>
        <div className="stat-value">{balance.toLocaleString()} ◎</div>
      </div>
    </div>
  );
}
