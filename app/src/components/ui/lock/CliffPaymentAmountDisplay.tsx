import * as anchor from "@coral-xyz/anchor";

import { shortenNumber } from "utils/formatters";

export default function CliffPaymentAmountDisplay({
  cliffPaymentAmount,
}: {
  cliffPaymentAmount: anchor.BN;
}) {
  return (
    <span>
      {shortenNumber(
        cliffPaymentAmount
          .div(new anchor.BN(10 ** this.mintInfo?.decimals))
          .toNumber(),
        4,
      )}
    </span>
  );
}
