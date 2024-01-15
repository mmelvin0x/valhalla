import { LockAccount } from "models/types";
import { FC, useMemo } from "react";
import { AiOutlineCloseCircle } from "react-icons/ai";

const CloseLockDialog: FC<{
  lock: LockAccount;
  onSubmit: (lock: LockAccount) => Promise<void>;
}> = ({ lock, onSubmit }) => {
  const value = useMemo(
    () =>
      lock
        ? (BigInt(lock.lockTokenAccount.amount)
            ? BigInt(lock.lockTokenAccount.amount) / BigInt(10 ** lock.decimals)
            : 0
          ).toString()
        : "0",
    [lock]
  );

  const balance = useMemo(
    () =>
      lock
        ? (BigInt(lock.lockTokenAccount.amount)
            ? BigInt(lock.lockTokenAccount.amount) / BigInt(10 ** lock.decimals)
            : 0
          ).toLocaleString()
        : "0",
    [lock]
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
          <button className="btn btn-circle btn-xs btn-ghost">
            <AiOutlineCloseCircle className="w-6 h-6 hover:text-white" />
          </button>
        </form>

        <p className="prose">
          This will withdraw all of your locked tokens and close the Lock.
        </p>

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
              await onSubmit(lock);
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
