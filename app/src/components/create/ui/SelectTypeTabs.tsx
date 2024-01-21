import { Dispatch, SetStateAction } from "react";

import { VestingType } from "program";

export default function SelectTypeTabs({
  formik,
  vestingType,
  setVestingType,
}: {
  formik: any;
  vestingType: VestingType;
  setVestingType: Dispatch<SetStateAction<VestingType>>;
}) {
  return (
    <>
      <div className="tabs tabs-boxed">
        <div
          className={`tab ${vestingType === VestingType.VestingSchedule ? "tab-active" : ""}`}
        >
          <a
            onClick={() => {
              formik.resetForm();
              setVestingType(0);
            }}
          >
            Vesting Schedule
          </a>
        </div>
        <div
          className={`tab ${vestingType === VestingType.TokenLock ? "tab-active" : ""}`}
        >
          <a
            onClick={() => {
              formik.resetForm();
              setVestingType(1);
            }}
          >
            Token Lock
          </a>
        </div>
        <div
          className={`tab ${vestingType === VestingType.ScheduledPayment ? "tab-active" : ""}`}
        >
          <a
            onClick={() => {
              formik.resetForm();
              setVestingType(2);
            }}
          >
            Scheduled Payment
          </a>
        </div>
      </div>

      {vestingType === VestingType.VestingSchedule && (
        <div className="prose mt-2">
          Vesting Schedules allow for the gradual release of tokens at set
          intervals, fostering long-term commitment.
        </div>
      )}

      {vestingType === VestingType.TokenLock && (
        <div className="prose mt-2">
          Token Locks are simpler, holding tokens until a specific date and then
          releasing them all at once, ideal for short-term goals.
        </div>
      )}

      {vestingType === VestingType.ScheduledPayment && (
        <div className="prose mt-2">
          Scheduled Payments provide a straightforward approach, with a single
          payout on a predetermined date, suited for immediate, uncomplicated
          transactions.
        </div>
      )}
    </>
  );
}
