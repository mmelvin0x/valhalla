import { ChangeEventHandler, Dispatch, SetStateAction, useMemo } from "react";
import { FormikContextType, FormikErrors, FormikValues } from "formik";

import { ICreateForm } from "@/src/utils/interfaces";
import { IconCirclePlus } from "@tabler/icons-react";
import { isPublicKey } from "@metaplex-foundation/umi";

export default function RecipientInput({
  values,
  handler,
  errors,
  disabled,
  vaultsToCreate,
  setVaultsToCreate,
  formik,
}: {
  disabled: boolean;
  values: FormikValues;
  handler: ChangeEventHandler<HTMLInputElement>;
  errors: FormikErrors<ICreateForm>;
  vaultsToCreate: ICreateForm[];
  setVaultsToCreate: Dispatch<SetStateAction<ICreateForm[]>>;
  formik: FormikContextType<ICreateForm>;
}) {
  const { recipient } = values;

  const totalVested = useMemo(
    () =>
      vaultsToCreate.reduce((acc, vault) => acc + +vault.amountToBeVested, 0),
    [vaultsToCreate]
  );

  const balance = useMemo(
    () =>
      (formik.values.selectedToken?.token_info.balance
        ? formik.values.selectedToken?.token_info.balance /
          10 ** formik.values.selectedToken?.token_info.decimals
        : 0
      ).toLocaleString(),
    [formik.values.selectedToken]
  );

  const balanceAsNumber = useMemo(
    () =>
      formik.values.selectedToken?.token_info.balance
        ? Number(
            (
              formik.values.selectedToken?.token_info.balance /
              10 ** formik.values.selectedToken?.token_info.decimals
            ).toFixed(formik.values.selectedToken?.token_info?.decimals)
          )
        : 0,
    [formik.values.selectedToken]
  );

  const half = useMemo(
    () =>
      Number(
        (balanceAsNumber / 2).toFixed(
          formik.values.selectedToken?.token_info?.decimals
        )
      ),

    [balanceAsNumber, formik.values.selectedToken?.token_info?.decimals]
  );

  const addRecipient = () => {
    if (!isPublicKey(recipient)) {
      formik.setFieldError("recipient", "Required");
      return;
    }

    if (vaultsToCreate.some((it) => it.recipient === recipient)) {
      formik.setFieldError("recipient", "Recipient already added");
      return;
    }

    if (!formik.values.amountToBeVested) {
      formik.setFieldError("amountToBeVested", "Required");
      return;
    }

    if (+formik.values.amountToBeVested + totalVested > balanceAsNumber) {
      formik.setFieldError("amountToBeVested", "Amount exceeds token balance");
      return;
    }

    setVaultsToCreate([
      ...vaultsToCreate,
      JSON.parse(JSON.stringify(values as ICreateForm)),
    ]);

    formik.setFieldValue("recipient", "");
    formik.setFieldValue("amountToBeVested", "");
    formik.setFieldTouched("recipient", false);
    formik.setFieldTouched("amountToBeVested", false);
    formik.setFieldError("recipient", "");
    formik.setFieldError("amountToBeVested", "");
  };

  return (
    <div className="form-control">
      <label htmlFor="" className="label">
        <span className="label-text font-bold">Recipient</span>
      </label>

      <div className="form-control">
        <input
          type="text"
          name="recipient"
          className={`input input-bordered ${
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

        <label htmlFor="" className="label">
          <span className="label-text font-bold">Token Amount</span>
          <span className="label-text-alt flex gap-1">
            <button
              type="button"
              className="btn btn-xs"
              onClick={() => formik.setFieldValue("amountToBeVested", half)}
            >
              Half
            </button>
            <button
              type="button"
              className="btn btn-xs"
              onClick={() =>
                formik.setFieldValue("amountToBeVested", balanceAsNumber)
              }
            >
              Max
            </button>
          </span>
        </label>

        <div className="w-full">
          <input
            type="number"
            name="amountToBeVested"
            placeholder="Amount"
            className={`input  input-bordered w-full ${
              errors.amountToBeVested && "input-error"
            }`}
            value={formik.values.amountToBeVested}
            onChange={handler}
            disabled={disabled}
          />
          <label className="label">
            <span className="label-text-alt text-error">
              {errors.amountToBeVested}
            </span>
            <span className="label-text-alt">
              Total Vested: {totalVested.toLocaleString()} / Balance: {balance}
            </span>
          </label>
        </div>

        <button
          className="btn btn-success btn-sm self-end"
          type="button"
          onClick={addRecipient}
        >
          <IconCirclePlus />
          Add Another Recipient?
        </button>
      </div>
    </div>
  );
}
