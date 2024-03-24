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
import { FormikContextType } from "formik";
import { ICreateForm } from "../utils/interfaces";
import { shortenNumber } from "@valhalla/lib";
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
  Legend
);

export default function VestmentChart({
  totalVestingDuration,
  amountToBeVested,
  payoutInterval,
  startDate,
  vestingEndDate,
  formik,
}: {
  totalVestingDuration: number;
  amountToBeVested: number;
  payoutInterval: number;
  startDate: Date;
  vestingEndDate: Date;
  formik: FormikContextType<ICreateForm>;
}) {
  const numPayments = useMemo(() => {
    return payoutInterval
      ? Math.ceil(
          totalVestingDuration / (payoutInterval <= 0 ? 1 : payoutInterval)
        )
      : 1;
  }, [totalVestingDuration, payoutInterval]);

  const labels = useMemo(() => {
    const start = new Date(startDate);
    const endDate = new Date(vestingEndDate);

    if (numPayments < 2) {
      return [endDate.toLocaleDateString()];
    }

    const labels = [];
    for (let i = 0; i < numPayments; i++) {
      const date = new Date(start.getTime() + payoutInterval * i);
      labels.push(date.toLocaleDateString());
    }

    return labels;
  }, [numPayments, payoutInterval, startDate, vestingEndDate]);

  const amountPerPayout = useMemo(() => {
    return {
      amount: amountToBeVested / numPayments,
      display: shortenNumber(amountToBeVested / numPayments, 2),
    };
  }, [numPayments, amountToBeVested]);

  const chartData = useMemo(() => {
    const values: number[] = [];
    labels.forEach((_, i) => {
      if (i === 0) {
        values.push(amountPerPayout.amount);
      } else {
        values.push(amountPerPayout.amount + values[i - 1]);
      }
    });

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

    return config;
  }, [labels, amountPerPayout]);

  return (
    <Bar
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
  );
}
