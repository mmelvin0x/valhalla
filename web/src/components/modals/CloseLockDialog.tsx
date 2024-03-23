import { FC, useMemo } from "react";

import { IconCircleX } from "@tabler/icons-react";
import { ValhallaVault } from "@valhalla/lib";

const CloseLockDialog: FC<{
  vault: ValhallaVault;
  onSubmit: (vault: ValhallaVault) => Promise<void>;
}> = ({ vault, onSubmit }) => {
  const value = useMemo(
    () =>
      vault
        ? (BigInt(vault.vaultAta!.amount)
            ? BigInt(vault.vaultAta!.amount) / BigInt(10 ** vault?.decimals!)
            : 0
          ).toString()
        : "0",
    [vault]
  );

  const balance = useMemo(
    () =>
      vault
        ? (BigInt(vault.vaultAta!.amount)
            ? BigInt(vault.vaultAta!.amount) / BigInt(10 ** vault.decimals!)
            : 0
          ).toLocaleString()
        : "0",
    [vault]
  );

  return (
    <dialog
      id="close_lock_modal"
      className="modal modal-bottom sm:modal-middle"
    >
      <div className="modal-box min-h-96 relative">
        <h3 className="">Withdraw Tokens</h3>

        <form method="dialog" className="absolute top-0 right-0 m-1">
          {/* if there is a button in form, it will close the modal */}
          <button className="btn btn-circle btn-sm">
            <IconCircleX className="w-6 h-6" />
          </button>
        </form>

        <p className="prose">This can only be done if the vault is empty.</p>

        <div className="form-control">
          <input
            type="number"
            placeholder="Amount"
            className="input input-bordered"
            value={value}
            disabled
          />
          <label className="label">
            <span className="label-text-alt"></span>
            <span className="label-text-alt">Locked: {balance}</span>
          </label>

          <button
            className="btn btn-primary"
            onClick={async () => {
              await onSubmit(vault);
            }}
          >
            Submit
          </button>
        </div>
      </div>
    </dialog>
  );
};

export default CloseLockDialog;
