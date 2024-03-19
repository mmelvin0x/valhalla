import { PublicKey } from "@solana/web3.js";
import { ValhallaVault } from "models/models";

export default function ActionButtons({
  vault,
  userKey,
  disburse,
  cancel,
  close,
}: {
  vault: ValhallaVault;
  userKey: PublicKey;
  disburse: (vault: ValhallaVault) => Promise<void>;
  cancel: (vault: ValhallaVault) => Promise<void>;
  close: (vault: ValhallaVault) => Promise<void>;
}) {
  return (
    <div className="flex flex-wrap gap-2 col-span-2">
      <button
        className="btn btn-sm btn-accent"
        disabled={!vault.canDisburse}
        onClick={() => disburse(vault)}
      >
        {vault.canDisburse ? "Disburse" : "Locked"}
      </button>

      <button
        className="btn btn-sm btn-error"
        disabled={!vault.canCancel(userKey)}
        onClick={() => cancel(vault)}
      >
        Cancel
      </button>

      <button
        className="btn btn-sm btn-error"
        disabled={!vault.paymentsComplete}
        onClick={() => close(vault)}
      >
        Close
      </button>
    </div>
  );
}
