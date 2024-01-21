import * as anchor from "@coral-xyz/anchor";

import {
  FaArrowAltCircleDown,
  FaArrowAltCircleUp,
  FaStopwatch,
} from "react-icons/fa";

import BaseModel from "models/models";
import { displayTime } from "utils/formatters";
import { useMemo } from "react";
import useProgram from "program/useProgram";
import { useValhallaStore } from "stores/useValhallaStore";

export default function DashboardStats() {
  const { balance } = useProgram();
  const { vestingSchedules, scheduledPayments, tokenLocks } =
    useValhallaStore();

  const nextRelease = useMemo(() => {
    let earliestVestingSchedule = 0;
    vestingSchedules.recipient.forEach(
      (vestingSchedule: BaseModel, i: number) => {
        const nextPaymentDate = vestingSchedule.nextPayoutDate;
        if (i === 0) {
          earliestVestingSchedule = nextPaymentDate.getTime();
        }

        if (nextPaymentDate.getTime() < earliestVestingSchedule) {
          earliestVestingSchedule = nextPaymentDate.getTime();
        }
      },
    );

    let earliestScheduledPayment = 0;
    scheduledPayments.recipient.forEach(
      (vestingSchedule: BaseModel, i: number) => {
        const nextPaymentDate = vestingSchedule.nextPayoutDate;
        if (i === 0) {
          earliestScheduledPayment = nextPaymentDate.getTime();
        }

        if (nextPaymentDate.getTime() < earliestScheduledPayment) {
          earliestScheduledPayment = nextPaymentDate.getTime();
        }
      },
    );

    let earliestTokenLocks = 0;
    tokenLocks.funded.forEach((vestingSchedule: BaseModel, i: number) => {
      const nextPaymentDate = vestingSchedule.nextPayoutDate;
      if (i === 0) {
        earliestTokenLocks = nextPaymentDate.getTime();
      }

      if (nextPaymentDate.getTime() < earliestTokenLocks) {
        earliestTokenLocks = nextPaymentDate.getTime();
      }
    });

    const earliest = Math.min(
      earliestVestingSchedule,
      earliestScheduledPayment,
      earliestTokenLocks,
    );

    if (earliest === 0) {
      return "None";
    }

    if (earliest < Date.now()) {
      return "Now";
    }

    return displayTime(earliest);
  }, [vestingSchedules, scheduledPayments, tokenLocks]);

  return (
    <div className="stats stats-vertical col-span-3">
      <div className="stat">
        <div className="stat-title">Next Release</div>
        <div className="stat-figure">
          <FaStopwatch className="text-5xl text-primary" />
        </div>
        <div className="stat-value">{nextRelease}</div>
        <div className="stat-desc">
          {nextRelease === "Now"
            ? "You have funds to accept"
            : "No upcoming releases"}
        </div>
      </div>

      <div className="stat">
        <div className="stat-title">Next Disbursement</div>
        <div className="stat-figure">
          <FaStopwatch className="text-5xl text-info" />
        </div>
        <div className="stat-value">0</div>
        <div className="stat-desc">lorem ipsum sit doler et</div>
      </div>

      <div className="stat">
        <div className="stat-title">Total Received</div>
        <div className="stat-figure">
          <FaArrowAltCircleDown className="text-5xl text-primary" />
        </div>
        <div className="stat-value">0</div>
        <div className="stat-desc">lorem ipsum sit doler et</div>
      </div>

      <div className="stat">
        <div className="stat-title">Total Disbursed</div>
        <div className="stat-figure">
          <FaArrowAltCircleUp className="text-5xl text-info" />
        </div>
        <div className="stat-value">0</div>
        <div className="stat-desc">lorem ipsum sit doler et</div>
      </div>
    </div>
  );
}
