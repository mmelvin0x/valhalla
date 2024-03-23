import { Account } from "@solana/spl-token";
import { shortenNumber } from "@valhalla/lib";

export default function BalanceDisplay({
  tokenAccount,
  tokenAccountBalanceAsNumberPerDecimals,
}: {
  tokenAccount: Account | null;
  tokenAccountBalanceAsNumberPerDecimals: number;
}) {
  if (!tokenAccount) {
    <div className="flex items-center gap-1">{shortenNumber(0, 4)} </div>;
  }

  return (
    <div className="flex items-center gap-1">
      {shortenNumber(tokenAccountBalanceAsNumberPerDecimals, 4)}{" "}
    </div>
  );
}
