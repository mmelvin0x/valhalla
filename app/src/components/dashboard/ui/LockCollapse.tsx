import { FaCaretDown, FaCaretUp } from "react-icons/fa";

import CreatorDisplay from "components/ui/lock/CreatorDisplay";
import LoadingSpinner from "components/ui/LoadingSpinner";
import LockDetails from "./LockDetails";
import NameDisplay from "components/ui/lock/NameDisplay";
import NextPayoutDateDisplay from "components/ui/lock/NextPayoutDateDisplay";
import RecipientDisplay from "components/ui/lock/RecipientDisplay";
import TokenMintDisplay from "components/ui/lock/TokenMintDisplay";
import { ValhallaVault } from "models/models";
import useProgram from "program/useProgram";
import { useState } from "react";

export default function LockCollapse({
  vault,
  disburse,
  cancel,
  close,
}: {
  vault: ValhallaVault;
  disburse: (vault: ValhallaVault) => Promise<void>;
  cancel: (vault: ValhallaVault) => Promise<void>;
  close: (vault: ValhallaVault) => Promise<void>;
}) {
  const { connection } = useProgram();
  const [loading, setLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  return (
    <>
      <li
        key={vault.key.toBase58()}
        className="border rounded p-2 items-center gap-1 my-1 md:justify-between cursor-pointer bg-base-100 hover:bg-base-200 transition-colors"
        onClick={async () => {
          if (!showDetails) {
            setLoading(true);
            await vault.populate(connection, vault);
            setLoading(false);
          }

          setShowDetails(!showDetails);
        }}
      >
        <div className="font-bold">
          <NameDisplay id={vault.key} name={vault.name} />
        </div>

        <div className="flex flex-wrap gap-4">
          <div className="font-bold flex items-center gap-1 text-xs">
            Mint: <TokenMintDisplay connection={connection} mint={vault.mint} />
          </div>

          <div className="font-bold flex items-center gap-1 text-xs">
            Creator:{" "}
            <CreatorDisplay connection={connection} creator={vault.creator} />
          </div>

          <div className="font-bold flex items-center gap-1 text-xs">
            Recipient:{" "}
            <RecipientDisplay
              recipient={vault.recipient}
              creator={vault.creator}
              connection={connection}
            />
          </div>

          <div className="font-bold flex items-center gap-1 text-xs">
            Next Payout:{" "}
            <NextPayoutDateDisplay
              paymentsComplete={vault.paymentsComplete}
              nextPayoutDate={vault.nextPayoutDate}
            />
          </div>

          <button className="btn btn-xs btn-ghost">
            {showDetails ? <FaCaretUp /> : <FaCaretDown />}
          </button>
        </div>
      </li>
      {loading ? (
        <div className="flex flex-col items-center justify-center mt-8">
          <LoadingSpinner />
        </div>
      ) : (
        <>
          {showDetails && (
            <LockDetails
              vault={vault}
              disburse={disburse}
              cancel={cancel}
              close={close}
            />
          )}
        </>
      )}
    </>
  );
}
