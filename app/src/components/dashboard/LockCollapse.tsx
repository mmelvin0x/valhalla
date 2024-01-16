import { LockAccount } from "models/Lock";
import { useState } from "react";
import useProgram from "hooks/useProgram";
import LockDetails from "./LockDetails";
import { Tab } from "../../utils/constants";
import { FaCaretDown, FaCaretUp } from "react-icons/fa";
import LoadingSpinner from "../LoadingSpinner";

export default function LockCollapse({
  tab,
  lock,
  disburse,
  changeRecipient,
  cancel,
}: {
  tab: number;
  lock: LockAccount;
  disburse: (lock: LockAccount) => Promise<void>;
  changeRecipient: (lock: LockAccount) => Promise<void>;
  cancel: (lock: LockAccount) => Promise<void>;
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
            await lock.populateLock(connection, lock);
            setLoading(false);
          }

          setShowDetails(!showDetails);
        }}
      >
        <div className="font-bold">{lock.displayName}</div>

        <div className="font-bold flex items-center gap-1 text-xs">
          Token: {lock.displayTokenMint}
        </div>

        {tab === Tab.Recipient && (
          <div className="font-bold flex items-center gap-1">
            Funder: {lock.displayFunder}
          </div>
        )}

        {tab === Tab.Funder && (
          <div className="font-bold flex items-center gap-1 text-xs">
            Recipient: {lock.displayRecipient}
          </div>
        )}

        <div className="font-bold flex items-center gap-1 text-xs">
          Next: {lock.displayNextPayout}
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
