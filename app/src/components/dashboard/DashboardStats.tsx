import { useMemo } from "react";
import { FaArrowAltCircleDown, FaArrowAltCircleUp } from "react-icons/fa";
import useLocksStore from "stores/useLocksStore";
import * as anchor from "@coral-xyz/anchor";
import useProgram from "hooks/useProgram";
import { LockAccount } from "models/types";

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
        Math.floor(Date.now() / 1000)
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
        Math.floor(Date.now() / 1000)
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
      const lastPaymentTimestamp = lock.lastPaymentTimestamp;
      const payoutInterval = lock.payoutInterval;
      const timeSinceLastPayment = new anchor.BN(
        Math.floor(Date.now() / 1000)
      ).sub(lastPaymentTimestamp);

      if (timeSinceLastPayment.gte(payoutInterval)) {
        if (acc === null) {
          return lock;
        }

        if (lastPaymentTimestamp.lt(lock.lastPaymentTimestamp)) {
          return lock;
        }
      }

      return acc;
    }, null);

    if (earliestLock) {
      return new Date(
        earliestLock.lastPaymentTimestamp.mul(new anchor.BN(1000)).toNumber()
      ).toLocaleDateString();
    }

    return null;
  }, [userRecipientLocks]);

  // TODO: This seems off
  const earliestDisbursableLockDate = useMemo(() => {
    const earliestLock = userFunderLocks.reduce((acc, lock) => {
      const lastPaymentTimestamp = lock.lastPaymentTimestamp;
      const payoutInterval = lock.payoutInterval;
      const timeSinceLastPayment = new anchor.BN(
        Math.floor(Date.now() / 1000)
      ).sub(lastPaymentTimestamp);

      if (timeSinceLastPayment.gte(payoutInterval)) {
        if (acc === null) {
          return lock;
        }

        if (lastPaymentTimestamp.lt(lock.lastPaymentTimestamp)) {
          return lock;
        }
      }

      return acc;
    }, null);

    if (earliestLock) {
      return new Date(
        earliestLock.lastPaymentTimestamp.mul(new anchor.BN(1000)).toNumber()
      ).toLocaleDateString();
    }

    return null;
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
          {totalLocksClaimable
            ? `${totalLocksClaimable} / ${userRecipientLocks.length}`
            : "No Locks"}
        </div>
        <div className="stat-desc">{earliestClaimableLockDate}</div>
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
          {totalLocksDisbursable
            ? `${totalLocksDisbursable} / ${userFunderLocks.length}`
            : "No Locks"}
        </div>
        <div className="stat-desc">{earliestDisbursableLockDate}</div>
      </div>

      <div className="stat">
        <div className="stat-title">Wallet Balance</div>
        <div className="stat-value">{balance.toLocaleString()} ◎</div>
      </div>
    </div>
  );
}
