import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
} from "chart.js";

import { Bar } from "react-chartjs-2";
import { shortenNumber } from "utils/formatters";
import { useMemo } from "react";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Filler,
  Legend,
);

export default function VestmentChart({
  totalVestingDuration,
  amountToBeVested,
  payoutInterval,
  cliffPaymentAmount,
  startDate,
  vestingEndDate,
  formik,
}: {
  totalVestingDuration: number;
  amountToBeVested: number;
  payoutInterval: number;
  cliffPaymentAmount: number;
  startDate: Date;
  vestingEndDate: Date;
  formik: any;
}) {
  const numPayments = useMemo(() => {
    return payoutInterval
      ? Math.ceil(
          totalVestingDuration / (payoutInterval <= 0 ? 1 : payoutInterval),
        )
      : 1;
  }, [totalVestingDuration, payoutInterval]);

  const labels = useMemo(() => {
    console.log("wtf");
    const start = new Date(startDate);
    const endDate = new Date(vestingEndDate);
    console.log(payoutInterval);
    console.log(totalVestingDuration);
    const numberOfPayments = payoutInterval
      ? Math.ceil(totalVestingDuration / payoutInterval)
      : 1;
    if (numberOfPayments < 2) {
      return [endDate.toLocaleDateString()];
    }

    const labels = [];
    for (let i = 0; i < numberOfPayments; i++) {
      const date = new Date(start.getTime() + payoutInterval * i);
      labels.push(date.toLocaleDateString());
    }

    console.log(labels);
    return labels;
  }, [
    payoutInterval,
    startDate,
    totalVestingDuration,
    vestingEndDate,
    formik.values,
  ]);

  const amountPerPayout = useMemo(() => {
    return {
      amount: amountToBeVested / numPayments,
      display: shortenNumber(amountToBeVested / numPayments, 2),
    };
  }, [numPayments, amountToBeVested]);

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
  }, [labels, amountPerPayout, cliffPaymentAmount]);

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
