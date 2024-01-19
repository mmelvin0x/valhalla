import { FormikErrors, FormikValues } from "formik";

import { ChangeEventHandler } from "react";
import { FaQuestionCircle } from "react-icons/fa";
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
          <span className="label-text font-bold flex gap-1">
            Cliff Payment Amount{" "}
            <span
              className="tooltip tooltip-sm tooltip-info"
              data-tip="This is a one time payment disbursed along side of and in addition to the 1st payout."
            >
              <FaQuestionCircle className="text-info" />
            </span>
          </span>
        </label>

        <input
          name="cliffPaymentAmount"
          placeholder="Leave blank for no cliff payment"
          type="number"
          className={`input input-sm input-bordered ${errors.cliffPaymentAmount && "input-error"}`}
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
