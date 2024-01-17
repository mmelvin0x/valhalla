import { FormikValues, FormikErrors } from "formik";
import { ChangeEventHandler } from "react";
import { ICreateForm } from "utils/interfaces";

export default function CliffPaymentAmountInput({
  values,
  handler,
  errors,
}: {
  values: FormikValues;
  handler: ChangeEventHandler<any>;
  errors: FormikErrors<ICreateForm>;
}) {
  const { cliffPaymentAmount } = values;

  return (
    <div className="flex w-full gap-2">
      <div className="form-control w-full">
        <label htmlFor="" className="label">
          <span className="label-text font-bold">Cliff Payment Amount</span>
          <span className="label-text-alt">Paid with first disbursement</span>
        </label>

        <input
          name="cliffPaymentAmount"
          placeholder="Leave blank for no cliff payment"
          type="number"
          className="input input-sm input-bordered"
          min={0}
          value={cliffPaymentAmount}
          onChange={handler}
        />

        {!!errors.cliffPaymentAmount && (
          <label htmlFor="" className="label">
            <span className="text-error label-text-alt">
              {errors.cliffPaymentAmount}
            </span>
          </label>
        )}
      </div>
    </div>
  );
}
