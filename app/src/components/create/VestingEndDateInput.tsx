import { FormikValues, FormikErrors } from "formik";
import { ChangeEventHandler } from "react";
import { ICreateForm } from "utils/interfaces";

export default function VestingEndDateInput({
  values,
  handler,
  errors,
}: {
  values: FormikValues;
  handler: ChangeEventHandler<any>;
  errors: FormikErrors<ICreateForm>;
}) {
  return (
    <div className="form-control">
      <label htmlFor="" className="label">
        <span className="label-text font-bold">Vesting End Date</span>
      </label>

      <input
        type="date"
        className="input input-sm input-bordered"
        name="vestingEndDate"
        value={values.vestingEndDate}
        onChange={handler}
      />
    </div>
  );
}
