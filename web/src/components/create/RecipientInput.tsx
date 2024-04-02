import { FormikErrors, FormikValues } from "formik";

import { ChangeEventHandler } from "react";
import { ICreateForm } from "@/src/utils/interfaces";
import { IconCirclePlus } from "@tabler/icons-react";

export default function RecipientInput({
  values,
  handler,
  errors,
  disabled,
}: {
  disabled: boolean;
  values: FormikValues;
  handler: ChangeEventHandler<HTMLInputElement>;
  errors: FormikErrors<ICreateForm>;
}) {
  const { recipient } = values;

  return (
    <>
      <div className="form-control">
        <label htmlFor="" className="label">
          <span className="label-text font-bold self-end">Recipient</span>
          <span className="label-text font-bold flex items-center gap-1">
            <button disabled className="btn btn-success btn-sm">
              Add Recipient? <IconCirclePlus />
            </button>
          </span>
        </label>

        <input
          type="text"
          name="recipient"
          className={`input  input-bordered ${
            errors.recipient && "input-error"
          }`}
          placeholder={"Public Key of the recipient"}
          value={recipient}
          onChange={handler}
          disabled={disabled}
        />

        {!!errors.recipient && (
          <label htmlFor="" className="label">
            <span className="text-error label-text-alt">
              {errors.recipient}
            </span>
          </label>
        )}
      </div>
    </>
  );
}
