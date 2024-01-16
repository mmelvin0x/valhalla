import DatePicker from "react-datepicker";
import { useDates } from "utils/useDates";

export default function VestingDatesInput({
  setVestingEndDate,
  vestingEndDate,
  startDate,
}: {
  setVestingEndDate: (date: Date) => void;
  vestingEndDate: Date | null;
  startDate: Date | null;
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
            onClick={() => setVestingEndDate(new Date(thirtyDaysFromNow))}
          >
            30 Days
          </button>
          <button
            className={`btn btn-xs`}
            onClick={() => setVestingEndDate(new Date(sixtyDaysFromNow))}
          >
            60 Days
          </button>
          <button
            className={`btn btn-xs`}
            onClick={() => setVestingEndDate(new Date(ninetyDaysFromNow))}
          >
            90 Days
          </button>
        </span>
      </label>

      <DatePicker
        className="input input-sm input-bordered w-full"
        showIcon
        withPortal
        dateFormat="MM/dd/yyyy"
        toggleCalendarOnIconClick
        minDate={new Date(startDate)}
        selected={vestingEndDate}
        onChange={(date) => {
          // ensure that the date is not in the before start date
          if (date.getTime() < new Date(startDate).getTime()) {
            date = new Date(startDate);
          }

          setVestingEndDate(date);
        }}
      />
    </div>
  );
}
