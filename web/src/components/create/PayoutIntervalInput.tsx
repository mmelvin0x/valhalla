import { FormikErrors, FormikValues } from "formik";

import { ChangeEventHandler } from "react";
import { ICreateForm } from "@/src/utils/interfaces";
import { useDates } from "@/src/utils/useDates";

export default function PayoutIntervalInput({
  values,
  handler,
  errors,
  disabled,
}: {
  disabled: boolean;
  values: FormikValues;
  handler: ChangeEventHandler<HTMLSelectElement>;
  errors: FormikErrors<ICreateForm>;
}) {
  const { payoutInterval } = values;
  const { thirtyDays } = useDates();

  return (
    <div className="form-control">
      <label htmlFor="" className="label">
        <span className="label-text font-bold">Payout Interval</span>
      </label>
      <select
        className={`select select-bordered ${
          errors.payoutInterval && "select-error"
        }`}
        name="payoutInterval"
        value={payoutInterval}
        onChange={handler}
        disabled={disabled}
      >
        <option value={Number(1000 * 60 * 60)}>Every Minute</option>
        <option value={Number(1000 * 60 * 60)}>Every Hour</option>
        <option value={Number(60 * 60 * 24 * 1000)}>Every Day</option>
        <option value={Number(60 * 60 * 24 * 7 * 1000)}>Once a Week</option>
        <option value={thirtyDays}>Once a Month</option>
      </select>
      {!!errors.payoutInterval && (
        <label htmlFor="" className="label">
          <span className="label-text-alt text-error">
            {errors.payoutInterval}
          </span>
        </label>
      )}
    </div>
  );
}
