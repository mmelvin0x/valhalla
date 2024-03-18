import { displayTime, shortenAddress, shortenNumber } from "utils/formatters";

import { Authority } from "program";
import { DasApiAsset } from "@metaplex-foundation/digital-asset-standard-api";
import Link from "next/link";
import { PublicKey } from "@solana/web3.js";
import SocialBar from "components/ui/SocialBar";
import { getExplorerUrl } from "utils/explorer";
import { isPublicKey } from "@metaplex-foundation/umi";
import { useMemo } from "react";
import useProgram from "program/useProgram";

interface ReviewLockCardProps {
  creator: PublicKey;
  recipient: string;
  selectedToken?: DasApiAsset | null;
  totalVestingDuration: number;
  amountToBeVested: number;
  payoutInterval: number;
  startDate: Date;
  vestingEndDate: Date;
  cancelAuthority: Authority;
}

export default function ReviewLockCard({
  creator,
  recipient,
  selectedToken,
  vestingEndDate,
  totalVestingDuration,
  amountToBeVested,
  payoutInterval,
  startDate,
  cancelAuthority,
}: ReviewLockCardProps) {
  const { connection } = useProgram();

  const displayAmount = useMemo(
    () => shortenNumber(amountToBeVested, 4),
    [amountToBeVested],
  );

  const numPayments = useMemo(
    () =>
      !!totalVestingDuration && !!payoutInterval
        ? Math.round(totalVestingDuration / payoutInterval)
        : 1,
    [totalVestingDuration, payoutInterval],
  );

  const amountPerPayout = useMemo(
    () => ({
      amount: Math.round(amountToBeVested / numPayments),
      display:
        !!numPayments && !!amountToBeVested
          ? shortenNumber(Math.round(amountToBeVested / numPayments), 2)
          : "N/A",
    }),
    [numPayments, amountToBeVested],
  );

  const recipientKey = useMemo(
    () => (isPublicKey(recipient) ? new PublicKey(recipient) : null),
    [recipient],
  );

  const whoCanCancel = useMemo(() => {
    switch (Number(cancelAuthority)) {
      case Authority.Neither:
        return "No one";
      case Authority.Creator:
        return "You";
      case Authority.Recipient:
        return "Recipient";
      case Authority.Both:
        return `Both`;
    }
  }, [cancelAuthority]);

  const startDateDisplay = useMemo(
    () => new Date(startDate).toLocaleString(),
    [startDate],
  );

  const endDateDisplay = useMemo(
    () => new Date(vestingEndDate).toLocaleString(),
    [vestingEndDate],
  );

  const displayInterval = useMemo(() => {
    return displayTime(payoutInterval / 1000);
  }, [payoutInterval]);

  const displayTokenAddress = useMemo(
    () =>
      isPublicKey(selectedToken?.id)
        ? shortenAddress(new PublicKey(selectedToken?.id))
        : "",
    [selectedToken?.id],
  );

  return (
    <div className="card">
      <div className="card-body grid grid-cols-2 gap-4">
        <div className="flex flex-col">
          <div className="font-bold">Token</div>
          <div className="flex items-center gap-2">
            <div className="avatar">
              <Link
                href={getExplorerUrl(connection.rpcEndpoint, selectedToken?.id)}
                className="rounded-full w-12 h-12 link"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {selectedToken?.content.links?.["image"] ? (
                  <img
                    className="rounded-full"
                    src={selectedToken?.content.links?.["image"]}
                    alt={""}
                  />
                ) : (
                  <img className="rounded-full" src={"/LP.png"} alt={""} />
                )}
              </Link>
            </div>
            <div className="text-xl font-bold">
              {/* @ts-ignore */}
              {selectedToken?.content.metadata.symbol || displayTokenAddress}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="font-bold">Amount</div>
          <div className="text-xl font-bold">{displayAmount}</div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="font-bold">Payouts</div>
          <div className="text-xl font-bold">
            {numPayments} x {amountPerPayout.display}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="font-bold">Start Date</div>
          <div className="text-xl font-bold">{startDateDisplay}</div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="font-bold">Payout Date</div>
          <div className="text-xl font-bold">{endDateDisplay}</div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="font-bold">Payout Interval</div>
          <div className="text-xl font-bold">{displayInterval}</div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="font-bold">Cancel Authority</div>
          <div className="text-xl font-bold">{whoCanCancel}</div>
        </div>

        <hr className="col-span-2" />

        <div className="flex flex-col gap-2 col-span-2">
          <div className="font-bold">Questions?</div>
          <SocialBar showText={false} />
        </div>
      </div>
    </div>
  );
}
