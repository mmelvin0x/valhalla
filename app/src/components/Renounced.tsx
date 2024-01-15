import { LockAccount } from "models/types";
import { FC } from "react";
import { FaExclamationCircle, FaCheckCircle } from "react-icons/fa";

interface RenouncedProps {
  lock: LockAccount;
  showTitle?: boolean;
}

const Renounced: FC<RenouncedProps> = ({ lock, showTitle = true }) => {
  return (
    <div className="flex flex-col gap-2">
      {showTitle && <span className="font-bold">Renounced</span>}
      <div
        className={`tooltip ${
          !lock.canMint ? "tooltip-success" : "tooltip-error"
        }`}
        data-tip={
          !lock.canMint
            ? "The Mint Authority is renounced. No more tokens can be minted."
            : "More tokens may be minted. Minting will dilute existing holders."
        }
      >
        {lock.canMint ? (
          <div className="text-error flex items-center gap-1">
            <FaExclamationCircle />
            <span className="text-xs">Mintable</span>{" "}
          </div>
        ) : (
          <div className="text-success flex items-center gap-1">
            <FaCheckCircle />
            <span className="text-xs">Not Mintable</span>{" "}
          </div>
        )}
      </div>

      <div
        className={`tooltip ${
          !lock.canFreeze ? "tooltip-success" : "tooltip-error"
        }`}
        data-tip={
          !lock.canFreeze
            ? "The Freeze Authority is renounced. These tokens cannot be frozen."
            : "These tokens may be frozen. Freezing will prevent transfers, including buys and sells."
        }
      >
        {lock.canFreeze ? (
          <div className="text-error flex items-center gap-1">
            <FaExclamationCircle />
            <span className="text-xs">Can Freeze</span>{" "}
          </div>
        ) : (
          <div className="text-success flex items-center gap-1">
            <FaCheckCircle />
            <span className="text-xs">Cannot Freeze</span>{" "}
          </div>
        )}
      </div>
    </div>
  );
};

export default Renounced;
