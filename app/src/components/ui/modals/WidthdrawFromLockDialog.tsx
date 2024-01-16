import { LockAccount } from "models/Lock";
import { Dispatch, FC, SetStateAction, useMemo } from "react";
import { AiOutlineCloseCircle } from "react-icons/ai";

const WithdrawToRecipientDialog: FC<{
  lock: LockAccount;
  withdrawAmount: number;
  onSubmit: (lock: LockAccount) => Promise<void>;
  setWithdrawAmount: Dispatch<SetStateAction<number>>;
}> = ({ lock, withdrawAmount, setWithdrawAmount, onSubmit }) => {
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
      id="withdraw_to_recipient_modal"
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

        <div className="form-control">
          <div className="label flex justify-end">
            <div className="label-text-alt flex gap-2">
              <button
                className="btn btn-xs"
                onClick={() =>
                  setWithdrawAmount(
                    Number(
                      (
                        BigInt(lock.lockTokenAccount.amount) /
                        BigInt(10 ** lock.decimals) /
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
                  setWithdrawAmount(
                    Number(
                      BigInt(
                        BigInt(lock.lockTokenAccount.amount) /
                          BigInt(10 ** lock.decimals)
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
            value={withdrawAmount}
            onChange={(e) => setWithdrawAmount(Number(e.target.value))}
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

export default WithdrawToRecipientDialog;
