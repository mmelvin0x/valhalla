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
        className="select select-sm select-bordered"
        name="payoutInterval"
        value={payoutInterval}
        onChange={handler}
      >
        <option value={Number(1000 * 60 * 60)}>Every Hour</option>
        <option value={Number(60 * 60 * 24 * 1000)}>Every Day</option>
        <option value={Number(60 * 60 * 24 * 7 * 1000)}>Every Week</option>
        <option value={thirtyDays}>Every Month</option>
        <option value={thirtyDays * 4}>Every Quarter</option>
        <option value={thirtyDays * 12}>Every Year</option>
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
