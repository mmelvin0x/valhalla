import { FaCaretDown, FaCaretUp } from "react-icons/fa";
import { VestingType } from "../../../program";

import BaseModel from "models/Base.model";
import LoadingSpinner from "../../ui/LoadingSpinner";
import LockDetails from "./LockDetails";
import useProgram from "program/useProgram";
import { useState } from "react";

export default function LockCollapse({
  vestingType,
  lock,
  disburse,
  changeRecipient,
  cancel,
}: {
  vestingType: VestingType;
  lock: BaseModel;
  disburse: (lock: BaseModel) => Promise<void>;
  changeRecipient: (lock: BaseModel) => Promise<void>;
  cancel: (lock: BaseModel) => Promise<void>;
}) {
  const { connection } = useProgram();
  const [loading, setLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  return (
    <>
      <li
        key={lock.id.toBase58()}
        className="flex flex-wrap border rounded-lg p-2 items-center gap-1 my-1 md:justify-between cursor-pointer hover:bg-base-200 transition-colors"
        onClick={async () => {
          if (!showDetails) {
            setLoading(true);
            await lock.populate(connection, lock);
            setLoading(false);
          }

          setShowDetails(!showDetails);
        }}
      >
        <div className="font-bold">{lock.nameDisplay}</div>

        <div className="font-bold flex items-center gap-1 text-xs">
          Token: {lock.tokenMintDisplay}
        </div>

        <div className="font-bold flex items-center gap-1">
          Funder: {lock.funderDisplay}
        </div>

        <div className="font-bold flex items-center gap-1 text-xs">
          Recipient: {lock.recipientDisplay}
        </div>

        <div className="font-bold flex items-center gap-1 text-xs">
          Next Payout: {lock.nextPayoutDisplay}
        </div>

        <button className="btn btn-xs btn-ghost">
          {showDetails ? <FaCaretUp /> : <FaCaretDown />}
        </button>
      </li>
      {loading ? (
        <div className="flex flex-col items-center justify-center mt-8">
          <LoadingSpinner />
        </div>
      ) : (
        <>
          {showDetails && (
            <LockDetails
              lock={lock}
              disburse={disburse}
              cancel={cancel}
              changeRecipient={changeRecipient}
            />
          )}
        </>
      )}
    </>
  );
}
