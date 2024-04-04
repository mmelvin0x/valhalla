import { FormikErrors, FormikValues } from "formik";

import { PublicKey } from "@solana/web3.js";
import { shortenAddress } from "@valhalla/lib";

export default function SelectTokenInput({
  values,
  errors,
}: {
  errors: FormikErrors<FormikValues>;
  values: FormikValues;
}) {
  const { selectedToken } = values;

  return (
    <div className="form-control flex flex-col">
      <ul
        className={`select  items-center select-bordered mb-2 ${
          errors.selectedToken ? "select-error" : ""
        }`}
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
    </div>
  );
}
