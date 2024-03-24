import { FormikErrors, FormikValues } from "formik";

import { ChangeEventHandler } from "react";
import { ICreateForm } from "@/src/utils/interfaces";
import { useDates } from "@/src/utils/useDates";

export default function StartDateInput({
  values,
  handler,
  errors,
  disabled,
}: {
  disabled: boolean;
  values: FormikValues;
  handler: ChangeEventHandler<HTMLInputElement>;
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
        className={`input  input-bordered ${errors.startDate && "input-error"}`}
        name="startDate"
        placeholder="Date the first tokens will be unlocked"
        min={today.startOf("day").toString()}
        value={startDate}
        onChange={handler}
        disabled={disabled}
      />

      {!!errors.startDate && (
        <label htmlFor="" className="label">
          <span className="text-error label-text-alt">Invalid Date</span>
        </label>
      )}
    </div>
  );
}
