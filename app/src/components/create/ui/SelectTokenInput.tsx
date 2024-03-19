import { ChangeEventHandler, useMemo } from "react";
import { FormikErrors, FormikValues } from "formik";

import { ICreateForm } from "utils/interfaces";
import { PublicKey } from "@solana/web3.js";
import { shortenAddress } from "utils/formatters";

export default function SelectTokenInput({
  values,
  handler,
  errors,
  setFieldValue,
  disabled,
}: {
  disabled: boolean;
  values: FormikValues;
  handler: ChangeEventHandler<any>;
  errors: FormikErrors<ICreateForm>;
  setFieldValue: (
    field: string,
    value: any,
    shouldValidate?: boolean,
  ) => Promise<void> | Promise<FormikErrors<ICreateForm>>;
}) {
  const { amountToBeVested, selectedToken } = values;

  const balance = useMemo(
    () =>
      // @ts-ignore
      (selectedToken?.token_info.balance
        ? // @ts-ignore
          selectedToken?.token_info.balance /
          // @ts-ignore
          10 ** selectedToken?.token_info.decimals
        : 0
      ).toLocaleString(),
    [selectedToken],
  );

  const balanceAsNumber = useMemo(
    () =>
      // @ts-ignore
      selectedToken?.token_info.balance
        ? // @ts-ignore
          selectedToken?.token_info.balance /
          // @ts-ignore
          10 ** selectedToken?.token_info.decimals
        : 0,
    [selectedToken],
  );

  return (
    <>
      <div className="form-control flex flex-col">
        <label htmlFor="" className="label">
          <span className="label-text font-bold">Select a Token</span>
          <span className="label-text-alt flex gap-1">
            <button
              type="button"
              className="btn btn-xs"
              onClick={() =>
                setFieldValue(
                  "amountToBeVested",
                  Math.round(balanceAsNumber / 2),
                )
              }
            >
              Half
            </button>
            <button
              type="button"
              className="btn btn-xs"
              onClick={() =>
                setFieldValue("amountToBeVested", Math.round(balanceAsNumber))
              }
            >
              Max
            </button>
          </span>
        </label>
        <ul
          className={`select  items-center select-bordered mb-2 ${errors.selectedToken ? "select-error" : ""}`}
          onClick={() => {
            (
              document.getElementById("select_token_modal") as HTMLDialogElement
            ).showModal();
          }}
        >
          {selectedToken?.id ? (
            <li className="">
              <div className="flex items-center gap-8">
                <div className="rounded-full w-8 h-8">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {selectedToken?.content.links?.["image"] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      className="rounded-full"
                      src={selectedToken?.content.links?.["image"]}
                      alt={""}
                    />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img className="rounded-full" src={"/LP.png"} alt={""} />
                  )}
                </div>

                <div>
                  {selectedToken?.content.metadata.name ||
                    shortenAddress(new PublicKey(selectedToken.id))}
                </div>
              </div>
            </li>
          ) : (
            <div className="text-xs">select token</div>
          )}
        </ul>

        <div className="w-full">
          <input
            type="number"
            name="amountToBeVested"
            placeholder="Amount"
            className={`input  input-bordered w-full ${errors.amountToBeVested && "input-error"}`}
            value={amountToBeVested}
            onChange={handler}
            disabled={disabled}
          />
          <label className="label">
            <span className="label-text-alt text-error">
              {errors.amountToBeVested}
            </span>
            <span className="label-text-alt">Balance: {balance}</span>
          </label>
        </div>
      </div>
    </>
  );
}
