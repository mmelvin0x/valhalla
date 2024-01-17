import { ChangeEventHandler, Dispatch, SetStateAction } from "react";
import { FormikErrors, FormikValues } from "formik";
import { ICreateForm } from "utils/interfaces";
import { useDates } from "utils/useDates";

interface StartDateProps {
  setStartDate: Dispatch<SetStateAction<Date>>;
  startDate: Date;
}

export default function StartDateInput({
  values,
  handler,
  errors,
}: {
  values: FormikValues;
  handler: ChangeEventHandler<any>;
  errors: FormikErrors<ICreateForm>;
}) {
  const { startDate } = values;
  const { today } = useDates();
  return (
    <div className="form-control w-full">
      <label htmlFor="" className="label">
        <span className="label-text font-bold">Start Date</span>
      </label>

      <input
        type="date"
        className="input input-sm input-bordered"
        name="startDate"
        min={today.toDateString()}
        value={startDate}
        onChange={handler}
      />
    </div>
  );
}
