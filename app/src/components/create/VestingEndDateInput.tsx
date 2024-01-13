import { useDates } from "hooks/useDates";

export default function VestingEndDateInput({
  setVestingEndDate,
  vestingEndDate,
}: {
  setVestingEndDate: (date: Date) => void;
  vestingEndDate: Date | null;
}) {
  const { today, thirtyDaysFromNow, sixtyDaysFromNow, ninetyDaysFromNow } =
    useDates();

  return (
    <div className="form-control">
      <label htmlFor="" className="label">
        <span className="label-text font-bold">Vesting End Date</span>
        <span className="label-text-alt flex gap-2 self-end">
          <button
            className={`btn btn-xs`}
            onClick={() =>
              setVestingEndDate(
                new Date(new Date(thirtyDaysFromNow).setHours(0, 0, 0, 0))
              )
            }
          >
            30 Days
          </button>
          <button
            className={`btn btn-xs`}
            onClick={() =>
              setVestingEndDate(
                new Date(new Date(sixtyDaysFromNow).setHours(0, 0, 0, 0))
              )
            }
          >
            60 Days
          </button>
          <button
            className={`btn btn-xs`}
            onClick={() =>
              setVestingEndDate(
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
        value={
          vestingEndDate
            ? new Date(vestingEndDate).toISOString().substring(0, 16)
            : new Date(thirtyDaysFromNow).toISOString().substring(0, 16)
        }
        onChange={(e) => setVestingEndDate(new Date(e.target.valueAsDate))}
      />
    </div>
  );
}
