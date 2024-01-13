import { DasApiAsset } from "@metaplex-foundation/digital-asset-standard-api";
import { Dispatch, SetStateAction, useMemo } from "react";

export default function CliffPaymentAmountInput({
  setCliffPaymentAmount,
  cliffPaymentAmount,
  selectedToken,
  amountToBeVested,
}: {
  setCliffPaymentAmount: Dispatch<SetStateAction<number>>;
  cliffPaymentAmount: number;
  selectedToken?: DasApiAsset;
  amountToBeVested: number;
}) {
  const balance = useMemo(
    () =>
      // @ts-ignore
      selectedToken?.token_info.balance
        ? // @ts-ignore
          selectedToken?.token_info.balance /
          // @ts-ignore
          10 ** selectedToken?.token_info.decimals
        : 0,
    [selectedToken]
  );

  const cliffPaymentMax = useMemo(
    () => balance - amountToBeVested,
    [balance, amountToBeVested]
  );

  return (
    <div className="flex w-full gap-2">
      <div className="form-control w-full">
        <label htmlFor="" className="label">
          <span className="label-text font-bold">Cliff Payment Amount</span>
          {cliffPaymentAmount <= cliffPaymentMax ? (
            <span className="label-text-alt">Paid with first disbursement</span>
          ) : (
            <span className="label-text-alt text-error">
              Exceeds available balance
            </span>
          )}
        </label>

        <input
          type="number"
          className="input input-sm input-bordered"
          min={0}
          max={cliffPaymentMax}
          value={cliffPaymentAmount}
          onChange={(e) => setCliffPaymentAmount(+e.target.value)}
        />
      </div>
    </div>
  );
}
