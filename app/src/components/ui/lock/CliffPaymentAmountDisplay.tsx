import * as anchor from "@coral-xyz/anchor";

import { Mint } from "@solana/spl-token";
import { shortenNumber } from "utils/formatters";

export default function CliffPaymentAmountDisplay({
  cliffPaymentAmount,
  mintInfo,
}: {
  cliffPaymentAmount: anchor.BN;
  mintInfo: Mint;
}) {
  return (
    <span>
      {shortenNumber(
        cliffPaymentAmount
          .div(new anchor.BN(10 ** mintInfo?.decimals))
          .toNumber(),
        4,
      )}
    </span>
  );
}
