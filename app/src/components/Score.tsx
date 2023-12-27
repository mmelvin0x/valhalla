import { LockAccount } from "program/accounts";
import { FC } from "react";
import { FaLock, FaUnlock } from "react-icons/fa";

interface ScoreProps {
  lock: LockAccount;
  tooltipDirection?: string;
}

const Score: FC<ScoreProps> = ({ lock, tooltipDirection }) => {
  return (
    <div
      className={`relative tooltip ${tooltipDirection} ${
        Number(lock.score) <= 5
          ? "tooltip-error"
          : Number(lock.score) <= 8
          ? "tooltip-warning"
          : "tooltip-success"
      }`}
      data-tip={
        Number(lock.score) <= 5
          ? "This trading pair is vulnerable to a 'rug pull'."
          : Number(lock.score) <= 8
          ? "This trading pair is questionable."
          : "This trading pair has met the requirements to be considered safe."
      }
    >
      {lock.canUnlock ? (
        <FaUnlock
          className={`text-4xl ${
            Number(lock.score) <= 5
              ? "text-error"
              : Number(lock.score) <= 8
              ? "text-warning"
              : "text-success"
          }`}
        />
      ) : (
        <FaLock
          className={`text-4xl ${
            Number(lock.score) <= 5
              ? "text-error"
              : Number(lock.score) <= 8
              ? "text-warning"
              : "text-success"
          }`}
        />
      )}

      <div
        className={`absolute text-center text-xs font-bold text-base-content top-1/2 right-2`}
      >
        {Number(lock.score)}
      </div>
    </div>
  );
};

export default Score;
