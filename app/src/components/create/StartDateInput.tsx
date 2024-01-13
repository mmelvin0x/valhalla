import { Dispatch, SetStateAction } from "react";
import { useDates } from "../../hooks/useDates";

interface StartDateProps {
  setStartDate: Dispatch<SetStateAction<Date>>;
  startDate: Date;
}

export default function StartDateInput({
  setStartDate,
  startDate,
}: StartDateProps) {
  const { today, thirtyDaysFromNow, sixtyDaysFromNow, ninetyDaysFromNow } =
    useDates();

  return (
    <div className="form-control w-full">
      <label htmlFor="" className="label">
        <span className="label-text font-bold">Start Date</span>
        <span className="label-text-alt flex gap-2 self-end">
          <button
            className={`btn btn-xs`}
            onClick={() =>
              setStartDate(
                new Date(new Date(thirtyDaysFromNow).setHours(0, 0, 0, 0))
              )
            }
          >
            30 Days
          </button>
          <button
            className={`btn btn-xs`}
            onClick={() =>
              setStartDate(
                new Date(new Date(sixtyDaysFromNow).setHours(0, 0, 0, 0))
              )
            }
          >
            60 Days
          </button>
          <button
            className={`btn btn-xs`}
            onClick={() =>
              setStartDate(
                new Date(new Date(ninetyDaysFromNow).setHours(0, 0, 0, 0))
              )
            }
          >
            90 Days
          </button>
        </span>
      </label>

      <input
        type="datetime-local"
        className="input input-sm input-bordered"
        min={new Date(today).toISOString().substring(0, 16)}
        value={new Date(startDate).toISOString().substring(0, 16)}
        onChange={(e) => setStartDate(new Date(e.target.value))}
      />
    </div>
  );
}
