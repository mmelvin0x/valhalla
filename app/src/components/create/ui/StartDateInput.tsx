import { FormikErrors, FormikValues } from "formik";

import { ChangeEventHandler } from "react";
import { ICreateForm } from "utils/interfaces";
import { useDates } from "utils/useDates";

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
        type="datetime-local"
        className={`input  input-bordered ${errors.startDate && "input-error"}`}
        name="startDate"
        placeholder="Date the first tokens will be unlocked"
        min={today.toDate().getTime()}
        value={startDate}
        onChange={handler}
      />

      {!!errors.startDate && (
        <label htmlFor="" className="label">
          <span className="text-error label-text-alt">Invalid Date</span>
        </label>
      )}
    </div>
  );
}
