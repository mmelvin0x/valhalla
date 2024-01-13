import { useDates } from "hooks/useDates";
import { Dispatch, SetStateAction, ChangeEvent } from "react";

export default function PayoutIntervalInput({
  setPayoutInterval,
  payoutInterval,
}: {
  setPayoutInterval: Dispatch<SetStateAction<number>>;
  payoutInterval: number;
}) {
  const { thirtyDays } = useDates();

  return (
    <div className="form-control">
      <label htmlFor="" className="label">
        <span className="label-text font-bold">Payout Interval</span>
      </label>
      <select
        className="select select-sm select-bordered"
        value={payoutInterval}
        onChange={(e: ChangeEvent<HTMLSelectElement>) =>
          setPayoutInterval(+e.target.value)
        }
      >
        <option value={Number(3600 * 24 * 1000)}>Every Day</option>
        <option value={Number(3600 * 24 * 7 * 1000)}>Every Week</option>
        <option value={thirtyDays}>Every Month</option>
        <option value={thirtyDays * 4}>Every Quarter</option>
        <option value={thirtyDays * 12}>Every Year</option>
      </select>
    </div>
  );
}
