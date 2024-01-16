import { Dispatch, SetStateAction } from "react";
import DatePicker from "react-datepicker";
import { useDates } from "../../utils/useDates";

interface StartDateProps {
  setStartDate: Dispatch<SetStateAction<Date>>;
  startDate: Date;
}

export default function StartDateInput({
  setStartDate,
  startDate,
}: StartDateProps) {
  const { tomorrow, thirtyDaysFromNow, sixtyDaysFromNow, ninetyDaysFromNow } =
    useDates();

  return (
    <div className="form-control w-full">
      <label htmlFor="" className="label">
        <span className="label-text font-bold">Start Date</span>
        <span className="label-text-alt flex gap-2 self-end">
          <button
            className={`btn btn-xs`}
            onClick={() => setStartDate(new Date(thirtyDaysFromNow))}
          >
            30 Days
          </button>
          <button
            className={`btn btn-xs`}
            onClick={() => setStartDate(new Date(sixtyDaysFromNow))}
          >
            60 Days
          </button>
          <button
            className={`btn btn-xs`}
            onClick={() => setStartDate(new Date(ninetyDaysFromNow))}
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
        minDate={new Date(tomorrow)}
        selected={startDate}
        onChange={(date) => {
          // ensure that the date is at least tomorrow
          if (date.getTime() < new Date(tomorrow).getTime()) {
            date = new Date(tomorrow);
          }

          setStartDate(date);
        }}
      />
    </div>
  );
}
