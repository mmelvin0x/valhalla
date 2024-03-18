import {
  FaArrowAltCircleUp,
  FaCalendar,
  FaCoins,
  FaUserLock,
} from "react-icons/fa";

import { useMemo } from "react";
import { useValhallaStore } from "stores/useValhallaStore";

export default function DashboardStats() {
  const { vaults } = useValhallaStore();
  const nextVaultDisbursement = useMemo(() => {
    const next = vaults.recipient
      .map((v) => ({
        time: v.nextPayoutDate.getTime(),
        display: v.nextPayoutShortDate,
      }))
      .sort((a, b) => a.time - b.time);
    return next[0]?.display || "None";
  }, [vaults.recipient]);

  return (
    <div className="stats stats-vertical lg:stats-horizontal">
      <div className="stat">
        <div className="stat-title">Unlocks</div>
        <div className="stat-value">{nextVaultDisbursement}</div>
        <div className="stat-figure hidden sm:block cursor-pointer rounded-full">
          {nextVaultDisbursement === "Now" && (
            <FaArrowAltCircleUp className="w-12 h-12 text-accent animate-pulse" />
          )}

          {nextVaultDisbursement !== "Now" && (
            <FaCalendar className="w-12 h-12" />
          )}
        </div>
        <div className="stat-desc">Next vestment date</div>
      </div>

      <div className="stat">
        <div className="stat-title">Created Vaults</div>
        <div className="stat-value">{vaults.created.length}</div>
        <div className="stat-figure hidden sm:block cursor-pointer rounded-full">
          <FaUserLock className="w-12 h-12" />
        </div>
      </div>

      <div className="stat">
        <div className="stat-title">Receivable Vaults</div>
        <div className="stat-value">{vaults.recipient.length}</div>
        <div className="stat-figure hidden sm:block cursor-pointer rounded-full">
          <FaCoins className="w-12 h-12" />
        </div>
      </div>
    </div>
  );
}
