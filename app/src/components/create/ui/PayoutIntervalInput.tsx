import { FormikErrors, FormikValues } from "formik";

import { ChangeEventHandler } from "react";
import { ICreateForm } from "utils/interfaces";
import { useDates } from "utils/useDates";

export default function PayoutIntervalInput({
  values,
  handler,
  errors,
}: {
  values: FormikValues;
  handler: ChangeEventHandler<any>;
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
        className={`select select-bordered ${errors.payoutInterval && "select-error"}`}
        name="payoutInterval"
        value={payoutInterval}
        onChange={handler}
      >
        <option value={Number(1000 * 60 * 60)}>Hourly</option>
        <option value={Number(60 * 60 * 24 * 1000)}>Daily</option>
        <option value={Number(60 * 60 * 24 * 1000 * 2)}>Every 2 days</option>
        <option value={Number(60 * 60 * 24 * 7 * 1000)}>Weekly</option>
        <option value={thirtyDays}>Monthly</option>
        <option value={thirtyDays * 4}>Quarterly</option>
        <option value={thirtyDays * 12}>Annually</option>
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
