import { LockAccount } from "program/accounts";
import { FC } from "react";
import { FaCheckCircle, FaExclamationCircle } from "react-icons/fa";

interface PercentLockedProps {
  lock: LockAccount;
}

const PercentLocked: FC<PercentLockedProps> = ({ lock }) => {
  return (
    <div className="flex flex-col gap-2">
      <span className="font-bold">Percent Locked</span>
      <div className="flex items-center gap-2">
        <span>{lock.displayPercentLocked}</span>
        <div
          className={`tooltip ${
            lock.percentLocked > 0.7 ? "tooltip-success" : "tooltip-error"
          }`}
          data-tip={
            lock.percentLocked > 0.7
              ? "> 70% of LP is locked."
              : "< 70% of LP is locked."
          }
        >
          {lock.percentLocked > 0.7 ? (
            <FaCheckCircle className="text-success" />
          ) : (
            <FaExclamationCircle className="text-error" />
          )}
        </div>
      </div>
    </div>
  );
};

export default PercentLocked;
