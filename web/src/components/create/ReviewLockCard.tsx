import { Authority, shortenNumber } from "@valhalla/lib";
import { IconCircleCheck, IconCoin } from "@tabler/icons-react";

import CancelAuthorityDisplay from "../lock/CancelAuthorityDisplay";
import { DasApiAsset } from "@metaplex-foundation/digital-asset-standard-api";
import EndDateDisplay from "../lock/EndDateDisplay";
import { ICreateForm } from "@/src/utils/interfaces";
import Link from "next/link";
import PayoutIntervalDisplay from "../lock/PayoutIntervalDisplay";
import { PublicKey } from "@solana/web3.js";
import RecipientDisplay from "../lock/RecipientDisplay";
import StartDateDisplay from "../lock/StartDateDisplay";
import TokenMintDisplay from "../lock/TokenMintDisplay";
import { getExplorerUrl } from "@/src/utils/explorer";
import { useMemo } from "react";
import useProgram from "@/src/hooks/useProgram";

interface ReviewLockCardProps {
  creator: PublicKey;
  recipient: PublicKey | null;
  selectedToken?: (DasApiAsset & { token_info: any }) | null;
  totalVestingDuration: number;
  amountToBeVested: number;
  payoutInterval: number;
  startDate: Date;
  vestingEndDate: Date;
  cancelAuthority: Authority;
  isSubmitting: boolean;
  autopay: boolean;
  isReview?: boolean;
  vaultsToCreate: ICreateForm[];
}

export default function ReviewLockCard({
  creator,
  recipient,
  selectedToken,
  totalVestingDuration,
  amountToBeVested,
  payoutInterval,
  startDate,
  cancelAuthority,
  vestingEndDate,
  autopay,
  isReview,
  vaultsToCreate,
}: ReviewLockCardProps) {
  const { connection } = useProgram();

  const authority = useMemo(() => cancelAuthority, [cancelAuthority]);

  const displayAmount = useMemo(() => {
    if (isReview) {
      const totalAmountVested = vaultsToCreate.reduce(
        (acc, vault) => acc + +vault.amountToBeVested,
        0
      );
      return shortenNumber(totalAmountVested, 4) == "0"
        ? `${totalAmountVested} ${
            selectedToken?.content.metadata.symbol ?? "UNK"
          }`
        : shortenNumber(totalAmountVested, 4);
    } else {
      return shortenNumber(amountToBeVested, 4) == "0"
        ? `${amountToBeVested} ${
            selectedToken?.content.metadata.symbol ?? "UNK"
          }`
        : shortenNumber(amountToBeVested, 4);
    }
  }, [
    amountToBeVested,
    selectedToken?.content.metadata.symbol,
    isReview,
    vaultsToCreate,
  ]);

  const numPayments = useMemo(
    () =>
      !!totalVestingDuration && !!payoutInterval
        ? Math.ceil(totalVestingDuration / payoutInterval) *
          (vaultsToCreate.length || 1)
        : 1,
    [totalVestingDuration, payoutInterval, vaultsToCreate]
  );

  const amountPerPayout = useMemo(() => {
    const amountVested =
      vaultsToCreate.reduce((acc, vault) => acc + +vault.amountToBeVested, 0) /
        (vaultsToCreate.length || 1) || amountToBeVested;
    return {
      amount: Number(
        (amountVested / numPayments).toFixed(
          selectedToken?.token_info?.decimals
        )
      ),
      display:
        !!numPayments && !!amountVested
          ? `${Number(
              (amountVested / numPayments).toFixed(
                selectedToken?.token_info?.decimals
              )
            ).toLocaleString()} ${
              selectedToken?.content.metadata.symbol ?? "UNK"
            }`
          : "",
    };
  }, [
    amountToBeVested,
    numPayments,
    selectedToken?.content.metadata.symbol,
    selectedToken?.token_info?.decimals,
    vaultsToCreate,
  ]);

  const mint = useMemo(
    () => (selectedToken?.id ? new PublicKey(selectedToken.id) : null),
    [selectedToken]
  );

  return (
    <div className={`grid grid-cols-2 gap-4`}>
      <div className="flex flex-col">
        <div className="font-bold">Token</div>
        <div className="flex items-center gap-2">
          {selectedToken ? (
            <>
              <div className="avatar">
                <Link
                  href={getExplorerUrl(
                    connection.rpcEndpoint,
                    selectedToken?.id
                  )}
                  className="rounded-full w-12 h-12 link"
                >
                  {/* @ts-expect-error image does exist */}
                  {selectedToken?.content.links?.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      className="rounded-full"
                      // @ts-expect-error image does exist
                      src={selectedToken?.content.links?.image}
                      alt={""}
                    />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img className="rounded-full" src={"/LP.png"} alt={""} />
                  )}
                </Link>
              </div>
              <div className="text-xl font-bold flex flex-col">
                {selectedToken?.content.metadata.symbol}
                <TokenMintDisplay connection={connection} mint={mint} />
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <IconCoin /> Select a token
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="font-bold">Amount</div>
        <div className="font-bold">{displayAmount}</div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="font-bold">Payouts</span>
          {autopay && (
            <div className="flex text-xs">
              Autopay <IconCircleCheck className="text-success w-4 h-4" />
            </div>
          )}
        </div>
        <div className="font-bold">
          {numPayments} x {amountPerPayout.display}
        </div>
      </div>

      {recipient && vaultsToCreate.length === 0 && (
        <div className="flex flex-col gap-2">
          <div className="font-bold">Recipient</div>
          <div className="font-bold">
            <RecipientDisplay
              connection={connection}
              recipient={new PublicKey(recipient)}
            />
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <div className="font-bold">Start Date</div>
        <div className="font-bold">
          <StartDateDisplay startDate={startDate} />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="font-bold">End Date</div>
        <div className="font-bold">
          <EndDateDisplay vestingEndDate={vestingEndDate} />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="font-bold">Payout Interval</div>
        <div className="font-bold">
          <PayoutIntervalDisplay payoutInterval={payoutInterval} />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="font-bold">Cancel Authority</div>
        <div className="font-bold">
          <CancelAuthorityDisplay
            connection={connection}
            authority={authority}
            creator={creator}
            recipient={recipient}
          />
        </div>
      </div>

      {isReview && vaultsToCreate.length > 0 && (
        <div className="flex flex-wrap gap-2 w-60">
          <div className="font-bold">Recipients</div>
          {vaultsToCreate.map((it) => (
            <div key={it.recipient} className="font-bold">
              <RecipientDisplay
                connection={connection}
                recipient={new PublicKey(it.recipient)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
