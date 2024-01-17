import { DasApiAsset } from "@metaplex-foundation/digital-asset-standard-api";
import { PublicKey } from "@solana/web3.js";
import { FormikValues, FormikErrors } from "formik";
import { ChangeEventHandler, Dispatch, SetStateAction, useMemo } from "react";
import { shortenAddress } from "utils/formatters";
import { ICreateForm } from "utils/interfaces";

interface SelectTokenInputProps {
  assets: DasApiAsset[];
  amountToBeVested: number;
  selectedToken: DasApiAsset | null;
  setAmountToBeVested: Dispatch<SetStateAction<number>>;
  setSelectedToken: Dispatch<SetStateAction<DasApiAsset>>;
}

export default function SelectTokenInput({
  values,
  handler,
  errors,
}: {
  values: FormikValues;
  handler: ChangeEventHandler<any>;
  errors: FormikErrors<ICreateForm>;
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

  return (
    <>
      <div className="form-control flex flex-col gap-2">
        <label htmlFor="" className="label">
          <span className="label-text font-bold">Select a Token</span>
          <div className="label-text-alt flex items-center gap-2">
            <ul
              className="select select-sm items-center select-bordered"
              onClick={() => {
                (
                  document.getElementById(
                    "select_token_modal",
                  ) as HTMLDialogElement
                ).showModal();
              }}
            >
              {selectedToken?.id ? (
                <li>
                  <div className="flex items-center gap-8">
                    <div className="rounded-full w-4 h-4">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        className="rounded-full"
                        src={
                          selectedToken?.content.links?.["image"] || "/LP.png"
                        }
                        alt={""}
                      />
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
          </div>
        </label>

        <div className="w-full">
          <input
            type="number"
            name="amountToBeVested"
            placeholder="Amount"
            className="input input-sm input-bordered w-full"
            value={amountToBeVested}
            onChange={handler}
          />
          <label className="label">
            <span className="label-text-alt"></span>
            <span className="label-text-alt">Balance: {balance}</span>
          </label>
        </div>
      </div>
    </>
  );
}
