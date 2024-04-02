import { FormikErrors, FormikValues } from "formik";

import { Authority } from "@valhalla/lib";
import { ChangeEventHandler } from "react";
import { ICreateForm } from "@/src/utils/interfaces";
import { IconUserQuestion } from "@tabler/icons-react";

export default function AuthoritiesInput({
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
  const { cancelAuthority } = values;
  return (
    <div className="form-contol w-full">
      <label htmlFor="" className="label">
        <span className="label-text font-bold">
          Cancel Authority{" "}
          <span
            className="tooltip tooltip-sm tooltip-secondary"
            data-tip="Decides who can cancel the vesting account."
          >
            <IconUserQuestion className="text-secondary" />
          </span>
        </span>
      </label>

      <select
        name="cancelAuthority"
        value={cancelAuthority}
        className={`select  select-bordered w-full ${
          errors.cancelAuthority && "select-error"
        }`}
        onChange={handler}
        disabled={disabled}
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
  );
}
