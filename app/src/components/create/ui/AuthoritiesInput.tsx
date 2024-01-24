import { FormikErrors, FormikValues } from "formik";

import { Authority } from "program";
import { ChangeEventHandler } from "react";
import { FaQuestionCircle } from "react-icons/fa";
import { ICreateForm } from "utils/interfaces";

export default function AuthoritiesInput({
  values,
  handler,
  errors,
}: {
  values: FormikValues;
  handler: ChangeEventHandler<any>;
  errors: FormikErrors<ICreateForm>;
}) {
  const { cancelAuthority, changeRecipientAuthority } = values;
  return (
    <div className="flex flex-col xl:flex-row items-center justify-between gap-2">
      <div className="form-contol w-full">
        <label htmlFor="" className="label">
          <span className="label-text font-bold">
            Cancel Authority{" "}
            <span
              className="tooltip tooltip-sm tooltip-info"
              data-tip="Decides who can cancel the vesting account."
            >
              <FaQuestionCircle className="text-info" />
            </span>
          </span>
        </label>

        <select
          name="cancelAuthority"
          value={cancelAuthority}
          className={`select  select-bordered w-full ${errors.cancelAuthority && "select-error"}`}
          onChange={handler}
        >
          <option value={Authority.Neither}>No One</option>
          <option value={Authority.Creator}>Only Creator</option>
          <option value={Authority.Recipient}>Only Recipient</option>
          <option value={Authority.Both}>Creator & Recipient</option>
        </select>

        {!!errors.cancelAuthority && (
          <label htmlFor="" className="label">
            <span className="label-text-alt text-error">
              {errors.cancelAuthority}
            </span>
          </label>
        )}
      </div>

      <div className="form-contol w-full">
        <label htmlFor="" className="label">
          <span className="label-text font-bold">
            Change Recipient{" "}
            <span
              className="tooltip tooltip-sm tooltip-info"
              data-tip="Decides who can change the recipient of the the vesting account payouts."
            >
              <FaQuestionCircle className="text-info" />
            </span>
          </span>
        </label>

        <select
          name="changeRecipientAuthority"
          value={changeRecipientAuthority}
          className={`select  select-bordered w-full ${errors.changeRecipientAuthority && "select-error"}`}
          onChange={handler}
        >
          <option value={Authority.Neither}>No One</option>
          <option value={Authority.Creator}>Only Creator</option>
          <option value={Authority.Recipient}>Only Recipient</option>
          <option value={Authority.Both}>Creator & Recipient</option>
        </select>

        {!!errors.changeRecipientAuthority && (
          <label htmlFor="" className="label">
            <span className="label-text-alt text-error">
              {errors.changeRecipientAuthority}
            </span>
          </label>
        )}
      </div>
    </div>
  );
}
