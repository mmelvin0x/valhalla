import { FormikErrors, FormikValues } from "formik";

import { ChangeEventHandler } from "react";
import { ICreateForm } from "@/src/utils/interfaces";

export default function VestingEndDateInput({
  values,
  handler,
  errors,
  disabled,
}: {
  disabled: boolean;
  values: FormikValues;
  handler: ChangeEventHandler<any>;
  errors: FormikErrors<ICreateForm>;
}) {
  return (
    <div className="form-control">
      <label htmlFor="" className="label">
        <span className="label-text font-bold">End Date</span>
      </label>

      <input
        type="date"
        className={`input  input-bordered ${
          errors.vestingEndDate && "input-error"
        }`}
        name="vestingEndDate"
        placeholder="Date the last tokens will be unlocked"
        min={values.startDate}
        value={values.vestingEndDate}
        onChange={handler}
        disabled={disabled}
      />

      {!!errors.vestingEndDate && (
        <label htmlFor="" className="label">
          <span className="text-error label-text-alt">Invalid Date</span>
        </label>
      )}
    </div>
  );
}
