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

  const nextReceivable = useMemo(() => {
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

  const nextPayable = useMemo(() => {
    let earliestVestingSchedule = 0;
    vestingSchedules.funded.forEach((vestingSchedule: BaseModel, i: number) => {
      const nextPaymentDate = vestingSchedule.nextPayoutDate;
      if (i === 0) {
        earliestVestingSchedule = nextPaymentDate.getTime();
      }

      if (nextPaymentDate.getTime() < earliestVestingSchedule) {
        earliestVestingSchedule = nextPaymentDate.getTime();
      }
    });

    let earliestScheduledPayment = 0;
    scheduledPayments.funded.forEach(
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

  const totalReceivable = useMemo(() => {
    return (
      vestingSchedules.recipient.length +
      scheduledPayments.recipient.length +
      tokenLocks.funded.length
    );
  }, [
    vestingSchedules.recipient.length,
    scheduledPayments.recipient.length,
    tokenLocks.funded.length,
  ]);

  const totalPayable = useMemo(() => {
    return vestingSchedules.funded.length + scheduledPayments.funded.length;
  }, [vestingSchedules.funded.length, scheduledPayments.funded.length]);

  return (
    <div className="stats stats-vertical col-span-3">
      <div className="stat">
        <div className="stat-title">Next Receivable</div>
        <div className="stat-figure">
          <FaStopwatch className="text-5xl text-primary" />
        </div>
        <div className="stat-value">{nextReceivable}</div>
        <div className="stat-desc">
          {nextReceivable === "Now"
            ? "You have funds to accept"
            : "No upcoming receivables"}
        </div>
      </div>

      <div className="stat">
        <div className="stat-title">Next Payable</div>
        <div className="stat-figure">
          <FaStopwatch className="text-5xl text-info" />
        </div>
        <div className="stat-value">{nextPayable}</div>
        <div className="stat-desc">
          {nextPayable === "Now"
            ? "You have funds to disburse"
            : "No upcoming payables"}
        </div>
      </div>

      <div className="stat">
        <div className="stat-title">Total Receivable</div>
        <div className="stat-figure">
          <FaArrowAltCircleDown className="text-5xl text-primary" />
        </div>
        <div className="stat-value">{totalReceivable || "None"}</div>
        <div className="stat-desc">
          {totalReceivable > 0
            ? "Accounts open with you as recipient"
            : "No open accounts"}
        </div>
      </div>

      <div className="stat">
        <div className="stat-title">Total Payable</div>
        <div className="stat-figure">
          <FaArrowAltCircleUp className="text-5xl text-info" />
        </div>
        <div className="stat-value">{totalPayable || "None"}</div>
        <div className="stat-desc">
          {totalPayable > 0
            ? "Accounts open with you as creator"
            : "No open accounts"}
        </div>
      </div>
    </div>
  );
}
