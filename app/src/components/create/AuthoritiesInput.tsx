import { FormikErrors, FormikValues } from "formik";
import { Authority } from "program";
import { ChangeEventHandler } from "react";
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
          <span className="label-text font-bold">Cancel Authority</span>
          <span className="label-text-alt">Can cancel the lock</span>
        </label>

        <select
          name="cancelAuthority"
          value={cancelAuthority}
          className="select select-sm select-bordered w-full"
          onChange={handler}
        >
          <option value={Authority.Neither}>Neither</option>
          <option value={Authority.Funder}>Only Funder</option>
          <option value={Authority.Recipient}>Only Recipient</option>
          <option value={Authority.Both}>Both</option>
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
          <span className="label-text font-bold">Change Recipient</span>
          <span className="label-text-alt">Can change recipient</span>
        </label>

        <select
          name="changeRecipientAuthority"
          value={changeRecipientAuthority}
          className="select select-sm select-bordered w-full"
          onChange={handler}
        >
          <option value={Authority.Neither}>Neither</option>
          <option value={Authority.Funder}>Only Funder</option>
          <option value={Authority.Recipient}>Only Recipient</option>
          <option value={Authority.Both}>Both</option>
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
