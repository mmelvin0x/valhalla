import { DasApiAsset } from "@metaplex-foundation/digital-asset-standard-api";
import { useConnection } from "@solana/wallet-adapter-react";
import Link from "next/link";
import { useMemo } from "react";
import { FaClipboardCheck } from "react-icons/fa";
import { getExplorerUrl } from "utils/explorer";
import { shortenNumber } from "utils/formatters";

interface ReviewLockCardProps {
  selectedToken: DasApiAsset | null;
  unlockDate: number;
  depositAmount: number;
}

export default function ReviewLockCard({
  selectedToken,
  unlockDate,
  depositAmount,
}: ReviewLockCardProps) {
  const { connection } = useConnection();
  const displayAmount = useMemo(
    () => shortenNumber(depositAmount, 4),
    [depositAmount]
  );
  return (
    <div className="card w-full">
      <div className="card-body">
        <div className="card-title">
          <FaClipboardCheck /> Review your lock information
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col">
            <div className="font-bold">Token</div>
            <div className="flex items-center gap-2">
              <div className="avatar">
                <Link
                  href={getExplorerUrl(
                    connection.rpcEndpoint,
                    selectedToken.id
                  )}
                  className="rounded-full w-12 h-12 link"
                >
                  <img
                    className="rounded-full avatar"
                    src={selectedToken?.content.links?.["image"] || "/LP.png"}
                    alt={""}
                  />
                </Link>
              </div>
              <div className="text-2xl font-bold">
                {/* @ts-ignore */}
                {selectedToken?.content.metadata.symbol}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="font-bold">Amount</div>
            <div className="text-2xl font-bold">{displayAmount}</div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="font-bold">Lock Date</div>
            <div className="text-2xl font-bold">
              {new Date().toDateString()}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="font-bold">Unlock Date</div>
            <div className="text-2xl font-bold">
              {new Date(unlockDate).toDateString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
