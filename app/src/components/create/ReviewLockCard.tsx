import { Authority, VestingType } from "program";
import { FaClipboard, FaDiscord, FaTelegram } from "react-icons/fa";
import {
  displayTime,
  getNumDaysFromMS,
  shortenAddress,
  shortenNumber,
} from "utils/formatters";

import { DasApiAsset } from "@metaplex-foundation/digital-asset-standard-api";
import Link from "next/link";
import { PublicKey } from "@solana/web3.js";
import { getExplorerUrl } from "utils/explorer";
import { isPublicKey } from "@metaplex-foundation/umi";
import { useDates } from "utils/useDates";
import { useMemo } from "react";
import useProgram from "program/useProgram";

interface ReviewLockCardProps {
  funder: PublicKey;
  recipient: string;
  selectedToken?: DasApiAsset | null;
  vestingDuration: number;
  amountToBeVested: number;
  payoutInterval: number;
  cliffPaymentAmount: number;
  startDate: Date;
  vestingEndDate: Date;
  cancelAuthority: Authority;
  changeRecipientAuthority: Authority;
  vestingType: VestingType;
}

export default function ReviewLockCard({
  funder,
  recipient,
  selectedToken,
  vestingEndDate,
  vestingDuration,
  amountToBeVested,
  payoutInterval,
  cliffPaymentAmount,
  startDate,
  cancelAuthority,
  changeRecipientAuthority,
  vestingType,
}: ReviewLockCardProps) {
  const { connection } = useProgram();

  const displayAmount = useMemo(
    () => shortenNumber(amountToBeVested, 4),
    [amountToBeVested],
  );

  const numPayments = useMemo(
    () => Math.round(vestingDuration / payoutInterval),
    [vestingDuration, payoutInterval],
  );

  const amountPerPayout = useMemo(
    () => ({
      amount: Math.round(amountToBeVested / numPayments),
      display: shortenNumber(Math.round(amountToBeVested / numPayments), 2),
    }),
    [numPayments, amountToBeVested],
  );

  const displayCliffAmount = useMemo(
    () => shortenNumber(cliffPaymentAmount, 4),
    [cliffPaymentAmount],
  );

  const recipientKey = useMemo(
    () => (isPublicKey(recipient) ? new PublicKey(recipient) : null),
    [recipient],
  );

  const whoCanCancel = useMemo(() => {
    switch (cancelAuthority) {
      case Authority.Neither:
        return "No one";
      case Authority.Funder:
        return shortenAddress(funder);
      case Authority.Recipient:
        return shortenAddress(recipientKey);
      case Authority.Both:
        return `Both`;
    }
  }, [cancelAuthority, funder, recipientKey]);

  const whoCanChangeRecipient = useMemo(() => {
    switch (changeRecipientAuthority) {
      case Authority.Neither:
        return "No one";
      case Authority.Funder:
        return shortenAddress(funder);
      case Authority.Recipient:
        return shortenAddress(recipientKey);
      case Authority.Both:
        return `Both`;
    }
  }, [changeRecipientAuthority, funder, recipientKey]);

  const displayStartDate = useMemo(
    () => new Date(startDate).toLocaleString(),
    [startDate],
  );

  const displayVestingEndDate = useMemo(
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
                <img
                  className="rounded-full avatar"
                  src={selectedToken?.content.links?.["image"] || "/LP.png"}
                  alt={""}
                />{" "}
              </Link>
            </div>
            <div className="text-2xl font-bold">
              {/* @ts-ignore */}
              {selectedToken?.content.metadata.symbol || displayTokenAddress}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="font-bold">Amount</div>
          <div className="text-2xl font-bold">{displayAmount}</div>
        </div>

        {vestingType === VestingType.VestingSchedule && (
          <div className="flex flex-col gap-2">
            <div className="font-bold">Cliff Payment</div>
            <div className="text-2xl font-bold">
              {cliffPaymentAmount > 0 ? (
                <span>1 x {displayCliffAmount}</span>
              ) : (
                <span>None</span>
              )}
            </div>
          </div>
        )}

        {vestingType === VestingType.VestingSchedule && (
          <div className="flex flex-col gap-2">
            <div className="font-bold">Payouts</div>
            <div className="text-2xl font-bold">
              {numPayments} x {amountPerPayout.display}
            </div>
          </div>
        )}

        {vestingType === VestingType.VestingSchedule && (
          <div className="flex flex-col gap-2">
            <div className="font-bold">Start Date</div>
            <div className="text-2xl font-bold">{displayStartDate}</div>
          </div>
        )}

        {(vestingType === VestingType.TokenLock ||
          vestingType === VestingType.OneTimePayment) && (
          <div className="flex flex-col gap-2">
            <div className="font-bold">Payout Date</div>
            <div className="text-2xl font-bold">{displayVestingEndDate}</div>
          </div>
        )}

        {vestingType === VestingType.VestingSchedule && (
          <div className="flex flex-col gap-2">
            <div className="font-bold">Payout Interval</div>
            <div className="text-2xl font-bold">{displayInterval}</div>
          </div>
        )}

        {vestingType !== VestingType.TokenLock && (
          <>
            <div className="flex flex-col gap-2">
              <div className="font-bold">Who can cancel?</div>
              <div className="text-2xl font-bold">{whoCanCancel}</div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="font-bold">Who can change recipient?</div>
              <div className="text-2xl font-bold">{whoCanChangeRecipient}</div>
            </div>
          </>
        )}

        <div className="flex flex-col gap-2">
          <div className="font-bold">Questions?</div>
          <div className="flex flex-wrap items-center gap-1">
            Check our{" "}
            <Link
              className="link link-secondary flex items-center"
              href="https://docs.valhalla.so"
              target="_blank"
            >
              <FaClipboard /> Docs
            </Link>{" "}
            or reach out
            <Link
              href="https://discord.gg/valhalla"
              className="link link-secondary flex items-center"
              target="_blank"
            >
              <FaDiscord className="text-xl" />
            </Link>
            <Link
              href="https://t.me/valhalla_so"
              className="link link-secondary flex items-center"
              target="_blank"
            >
              <FaTelegram className="text-xl" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
