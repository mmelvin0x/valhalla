import { FaArrowAltCircleUp, FaCalendar } from "react-icons/fa";

import { useMemo } from "react";
import { useValhallaStore } from "stores/useValhallaStore";

export default function DashboardStats() {
  const { vestingSchedules, tokenLocks, scheduledPayments } =
    useValhallaStore();

  const nextVestingUnlock = useMemo(() => {
    const next = vestingSchedules.recipient
      .map((v) => ({
        time: v.nextPayoutDate.getTime(),
        display: v.nextPayoutShortDate,
      }))
      .sort((a, b) => a.time - b.time);
    return next[0]?.display || "None";
  }, [vestingSchedules.recipient]);

  const nextTokenUnlock = useMemo(() => {
    const next = tokenLocks.created
      .map((v) => ({
        time: v.nextPayoutDate.getTime(),
        display: v.nextPayoutShortDate,
      }))
      .sort((a, b) => a.time - b.time);
    return next[0]?.display || "None";
  }, [tokenLocks.created]);

  const nextScheduledPayment = useMemo(() => {
    const next = scheduledPayments.recipient
      .map((v) => ({
        time: v.nextPayoutDate.getTime(),
        display: v.nextPayoutShortDate,
      }))
      .sort((a, b) => a.time - b.time);
    return next[0]?.display || "None";
  }, [scheduledPayments.recipient]);

  return (
    <div className="stats stats-vertical lg:stats-horizontal">
      <div className="stat">
        <div className="stat-title">Vestment Unlocks</div>
        <div className="stat-value">{nextVestingUnlock}</div>
        <div className="stat-figure hidden sm:block cursor-pointer rounded-full">
          {nextVestingUnlock === "Now" && (
            <FaArrowAltCircleUp className="w-12 h-12 text-accent animate-pulse" />
          )}

          {nextVestingUnlock !== "Now" && <FaCalendar className="w-12 h-12" />}
        </div>
        <div className="stat-desc">Next vestment date</div>
      </div>

      <div className="stat">
        <div className="stat-title">Token Unlocks</div>
        <div className="stat-value">{nextTokenUnlock}</div>
        <div className="stat-figure hidden sm:block">
          {nextTokenUnlock === "Now" && (
            <FaArrowAltCircleUp className="w-12 h-12 text-accent animate-pulse" />
          )}

          {nextTokenUnlock !== "Now" && <FaCalendar className="w-12 h-12" />}
        </div>
        <div className="stat-desc">Next unlock date</div>
      </div>

      <div className="stat">
        <div className="stat-title">Scheduled Payments</div>
        <div className="stat-value">{nextScheduledPayment}</div>
        <div className="stat-figure hidden sm:block">
          {nextScheduledPayment === "Now" && (
            <FaArrowAltCircleUp className="w-12 h-12 text-accent animate-pulse" />
          )}

          {nextScheduledPayment !== "Now" && (
            <FaCalendar className="w-12 h-12" />
          )}
        </div>
        <div className="stat-desc">Next payment date</div>
      </div>
    </div>
  );
}
