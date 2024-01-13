import { Dispatch, SetStateAction, useMemo, useState } from "react";
import { AiOutlineCloseCircle } from "react-icons/ai";
import { LockAccount } from "program/accounts";

interface ExtendLockDialogProps {
  lock: LockAccount;
  unlockDate: number;
  onSubmit: (lock: LockAccount) => Promise<void>;
  setUnlockDate: Dispatch<SetStateAction<number>>;
  dates: {
    today: number;
    thirtyDays: number;
    sixtyDays: number;
    ninetyDays: number;
    oneThousandYears: number;
  };
}

export default function ExtendLockDialog({
  lock,
  unlockDate,
  onSubmit,
  setUnlockDate,
  dates: { thirtyDays, sixtyDays, ninetyDays, oneThousandYears, today },
}: ExtendLockDialogProps) {
  return (
    <dialog
      id="extend_lock_modal"
      className="modal modal-bottom sm:modal-middle"
    >
      <div className="modal-box min-h-96 relative">
        <h3 className="">New Unlock Date</h3>

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
                className={`btn btn-xs`}
                onClick={() => setUnlockDate(thirtyDays)}
              >
                30 Days
              </button>
              <button
                className={`btn btn-xs`}
                onClick={() => setUnlockDate(sixtyDays)}
              >
                60 Days
              </button>
              <button
                className={`btn btn-xs`}
                onClick={() => setUnlockDate(ninetyDays)}
              >
                90 Days
              </button>
              <button
                className={`btn btn-xs`}
                onClick={() => setUnlockDate(oneThousandYears)}
              >
                Valhalla
              </button>
            </div>
          </div>
          <input
            type="datetime-local"
            className="input input-bordered"
            min={new Date(today).toISOString()}
            value={
              unlockDate
                ? new Date(unlockDate).toISOString()
                : new Date(thirtyDays).toISOString()
            }
            onChange={(e) => setUnlockDate(new Date(e.target.value).getTime())}
          />

          <button
            className="btn btn-primary mt-2"
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
