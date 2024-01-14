import { useMemo } from "react";
import { Bar, Line } from "react-chartjs-2";
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
  BarElement,
} from "chart.js";
import { shortenNumber } from "utils/formatters";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Filler,
  Legend
);

export default function VestmentChart({
  vestingDuration,
  amountToBeVested,
  payoutInterval,
  cliffPaymentAmount,
  startDate,
  vestingEndDate,
}: {
  vestingDuration: number;
  amountToBeVested: number;
  payoutInterval: number;
  cliffPaymentAmount: number;
  startDate: Date;
  vestingEndDate: Date;
}) {
  const numPayments = useMemo(
    () => Math.round(vestingDuration / payoutInterval),
    [vestingDuration, payoutInterval]
  );

  const labels = useMemo(() => {
    const labels = [];
    for (let i = 0; i < numPayments; i++) {
      const date = new Date(startDate.getTime() + i * payoutInterval);
      labels.push(date.toLocaleDateString());
    }

    return labels;
  }, [numPayments, payoutInterval, vestingDuration, startDate, vestingEndDate]);

  const amountPerPayout = useMemo(
    () => ({
      amount: amountToBeVested / numPayments,
      display: shortenNumber(amountToBeVested / numPayments, 2),
    }),
    [numPayments, amountToBeVested, cliffPaymentAmount]
  );

  const chartData = useMemo(() => {
    const values = [];
    labels.forEach((_, i) => {
      if (i === 0) {
        values.push(amountPerPayout.amount);
      } else {
        values.push(amountPerPayout.amount + values[i - 1]);
      }
    });

    const cliff =
      cliffPaymentAmount > 0 ? Array(1).fill(cliffPaymentAmount) : [];

    const config = {
      labels,
      datasets: [
        {
          label: "Disbursements (Cumulative)",
          data: values,
          fill: true,
          backgroundColor: "rgba(94, 129, 172, 0.8)",
          stepped: true,
        },
      ],
    };

    if (cliff.length > 0) {
      config.datasets.unshift({
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

  return (
    <div className="card">
      <div className="card-body">
        <div className="card-media">
          <Bar
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
  );
}
