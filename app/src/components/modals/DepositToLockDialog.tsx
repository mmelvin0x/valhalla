import { Dispatch, SetStateAction, useMemo, useState } from "react";
import { AiOutlineCloseCircle } from "react-icons/ai";
import { LockAccount } from "program/accounts";

interface DepositToLockDialogProps {
  lock: LockAccount;
  depositAmount: number;
  onSubmit: (lock: LockAccount) => Promise<void>;
  setDepositAmount: Dispatch<SetStateAction<number>>;
}

export default function DepositToLockDialog({
  lock,
  depositAmount,
  onSubmit,
  setDepositAmount,
}: DepositToLockDialogProps) {
  const balance = useMemo(
    () =>
      lock
        ? (BigInt(lock.userTokenAccount.amount)
            ? BigInt(lock.userTokenAccount.amount) /
              BigInt(10 ** lock.mint.decimals)
            : 0
          ).toLocaleString()
        : "0",
    [lock]
  );

  return (
    <dialog
      id="deposit_to_lock_modal"
      className="modal modal-bottom sm:modal-middle"
    >
      <div className="modal-box min-h-96 relative">
        <h3 className="">Deposit More Tokens</h3>

        <form method="dialog" className="absolute top-0 right-0 m-1">
          {/* if there is a button in form, it will close the modal */}
          <button className="btn btn-circle btn-xs btn-ghost">
            <AiOutlineCloseCircle className="w-6 h-6 hover:text-white" />
          </button>
        </form>

        <div className="form-control">
          <div className="label flex justify-end">
            <div className="label-text-alt flex gap-2">
              <button
                className="btn btn-xs"
                onClick={() =>
                  setDepositAmount(
                    Number(
                      (
                        BigInt(lock.userTokenAccount.amount) /
                        BigInt(10 ** lock.mint.decimals) /
                        BigInt(2)
                      ).toString()
                    )
                  )
                }
              >
                Half
              </button>
              <button
                className="btn btn-xs"
                onClick={() =>
                  setDepositAmount(
                    Number(
                      BigInt(
                        BigInt(lock.userTokenAccount.amount) /
                          BigInt(10 ** lock.mint.decimals)
                      ).toString()
                    )
                  )
                }
              >
                Max
              </button>
            </div>
          </div>
          <input
            type="number"
            placeholder="Amount"
            className="input input-bordered"
            value={depositAmount}
            onChange={(e) => setDepositAmount(Number(e.target.value))}
          />
          <label className="label">
            <span className="label-text-alt"></span>
            <span className="label-text-alt">Balance: {balance}</span>
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
}
