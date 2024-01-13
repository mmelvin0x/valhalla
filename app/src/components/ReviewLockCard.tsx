import { DasApiAsset } from "@metaplex-foundation/digital-asset-standard-api";
import { useConnection } from "@solana/wallet-adapter-react";
import Link from "next/link";
import { useMemo } from "react";
import { getExplorerUrl } from "utils/explorer";
import {
  getNumDaysFromMS,
  shortenAddress,
  shortenNumber,
} from "utils/formatters";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend,
} from "chart.js";
import { Authority } from "models/types";
import { PublicKey } from "@solana/web3.js";
import { isPublicKey } from "@metaplex-foundation/umi";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend
);

interface ReviewLockCardProps {
  funder: PublicKey;
  beneficiary: string;
  selectedToken?: DasApiAsset | null;
  vestingDuration: number;
  amountToBeVested: number;
  payoutInterval: number;
  cliffPaymentAmount: number;
  startDate: Date;
  cancelAuthority: Authority;
  changeBeneficiaryAuthority: Authority;
}

export default function ReviewLockCard({
  funder,
  beneficiary,
  selectedToken,
  vestingDuration,
  amountToBeVested,
  payoutInterval,
  cliffPaymentAmount,
  startDate,
  cancelAuthority,
  changeBeneficiaryAuthority,
}: ReviewLockCardProps) {
  const { connection } = useConnection();
  const displayAmount = useMemo(
    () => shortenNumber(amountToBeVested, 4),
    [amountToBeVested]
  );

  const numPayments = useMemo(
    () => Math.ceil(vestingDuration / payoutInterval),
    [vestingDuration, payoutInterval]
  );

  const labels = useMemo(() => {
    const labels = [];
    for (let i = 0; i < numPayments; i++) {
      labels.push(
        new Date(startDate.getTime() + i * payoutInterval).toLocaleDateString()
      );
    }

    return labels;
  }, [numPayments, payoutInterval, vestingDuration, startDate]);

  const amountPerPayout = useMemo(
    () => ({
      amount: Math.round(amountToBeVested / numPayments),
      display: shortenNumber(
        Math.round((amountToBeVested - cliffPaymentAmount) / numPayments),
        2
      ),
    }),
    [numPayments, amountToBeVested, cliffPaymentAmount]
  );

  const displayCliffAmount = useMemo(
    () => shortenNumber(cliffPaymentAmount, 4),
    [cliffPaymentAmount]
  );

  const beneficiaryKey = useMemo(
    () => (isPublicKey(beneficiary) ? new PublicKey(beneficiary) : null),
    [beneficiary]
  );

  const chartData = useMemo(() => {
    const values = [];
    labels.forEach((_, i) => {
      if (i === 0) {
        values.push(amountPerPayout.amount + cliffPaymentAmount);
      } else if (i === labels.length - 1) {
        values.push(values[i - 1]);
      } else {
        values.push(amountPerPayout.amount + values[i - 1]);
      }
    });

    const cliff =
      cliffPaymentAmount > 0
        ? Array(labels.length).fill(cliffPaymentAmount)
        : [];

    const config = {
      labels,
      datasets: [
        {
          label: "Total Disbursed",
          data: values,
          fill: true,
          backgroundColor: "rgba(94, 129, 172, 0.8)",
          stepped: true,
        },
      ],
    };

    if (cliff.length > 0) {
      config.datasets.push({
        label: "Cliff Payment",
        data: cliff,
        fill: true,
        backgroundColor: "rgba(255, 99, 132, 0.8)",
        stepped: true,
      });
    }

    return config;
  }, [
    numPayments,
    labels,
    amountPerPayout,
    startDate,
    cliffPaymentAmount,
    amountToBeVested,
    vestingDuration,
  ]);

  const whoCanCancel = useMemo(() => {
    switch (cancelAuthority) {
      case Authority.Neither:
        return "No one";
      case Authority.OnlyFunder:
        return shortenAddress(funder);
      case Authority.OnlyBeneficiary:
        return shortenAddress(beneficiaryKey);
      case Authority.Both:
        return `Both`;
    }
  }, [cancelAuthority, funder, beneficiaryKey]);

  const whoCanChangeBeneficiary = useMemo(() => {
    switch (changeBeneficiaryAuthority) {
      case Authority.Neither:
        return "No one";
      case Authority.OnlyFunder:
        return shortenAddress(funder);
      case Authority.OnlyBeneficiary:
        return shortenAddress(beneficiaryKey);
      case Authority.Both:
        return `Both`;
    }
  }, [changeBeneficiaryAuthority, funder, beneficiaryKey]);

  const displayStartDate = useMemo(
    () =>
      new Date(startDate.setHours(0, 0, 0, 0)).toLocaleDateString() +
      " " +
      new Date(startDate).toLocaleTimeString(),
    [startDate]
  );

  const displayInterval = useMemo(
    () => getNumDaysFromMS(payoutInterval),
    [payoutInterval]
  );

  return (
    <div className="flex flex-col gap-2 lg:gap-8">
      <div className="card">
        <div className="card-body">
          <div className="card-title">Preview the Vestment</div>

          <div className="card-media">
            <Line
              className="flex-1"
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    display: true,
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                  },
                },
              }}
              data={chartData}
            />
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-body grid grid-cols-2 gap-4">
          <div className="flex flex-col">
            <div className="font-bold">Token</div>
            <div className="flex items-center gap-2">
              <div className="avatar">
                <Link
                  href={getExplorerUrl(
                    connection.rpcEndpoint,
                    selectedToken?.id
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
            <div className="font-bold">Cliff Payment</div>
            <div className="text-2xl font-bold">
              {cliffPaymentAmount > 0 ? (
                <span>{displayCliffAmount}</span>
              ) : (
                <span>None</span>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="font-bold">Number of Payouts</div>
            <div className="text-2xl font-bold">
              {numPayments} x {amountPerPayout.display}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="font-bold">Start Date</div>
            <div className="text-2xl font-bold">{displayStartDate}</div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="font-bold">Payout Interval</div>
            <div className="text-2xl font-bold">{displayInterval} days</div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="font-bold">Who can cancel?</div>
            <div className="text-2xl font-bold">{whoCanCancel}</div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="font-bold">Who can change beneficiary?</div>
            <div className="text-2xl font-bold">{whoCanChangeBeneficiary}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
