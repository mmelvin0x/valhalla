import { PublicKey } from "@solana/web3.js";
import { ValhallaVault } from "@valhalla/lib";

export default function ActionButtons({
  vault,
  userKey,
  disburse,
  cancel,
  close,
}: {
  vault: ValhallaVault;
  userKey: PublicKey | null;
  disburse: (vault: ValhallaVault) => Promise<void>;
  cancel: (vault: ValhallaVault) => Promise<void>;
  close: (vault: ValhallaVault) => Promise<void>;
}) {
  return (
    <div className="flex flex-wrap gap-2 col-span-2">
      {!vault.autopay && (
        <button
          className="btn btn-sm btn-accent"
          disabled={!vault.canDisburse || vault.paymentsComplete}
          onClick={() => disburse(vault)}
        >
          {vault.canDisburse ? "Disburse" : "Locked"}
        </button>
      )}

      {vault.canCancel(userKey) && (
        <button className="btn btn-sm btn-error" onClick={() => cancel(vault)}>
          Cancel
        </button>
      )}

      {vault.canClose(userKey) && (
        <button className="btn btn-sm btn-error" onClick={() => close(vault)}>
          Close
        </button>
      )}
    </div>
  );
}
