import { Dispatch, SetStateAction } from "react";
import { FaCalendarAlt, FaCalendarCheck, FaLock } from "react-icons/fa";

import { VestingType } from "program";

export default function VestingTypeTabs({
  vestingType,
  setVestingType,
  totalVestingSchedules,
  totalScheduledPayments,
  totalTokenLocks,
}: {
  vestingType: VestingType;
  setVestingType: Dispatch<SetStateAction<VestingType>>;
  totalVestingSchedules: number;
  totalScheduledPayments: number;
  totalTokenLocks: number;
}) {
  return (
    <div className="tabs tabs-boxed">
      <div
        onClick={() => setVestingType(VestingType.VestingSchedule)}
        className={`tab flex items-center gap-2 ${vestingType === VestingType.VestingSchedule ? "tab-active" : ""}`}
      >
        <div className="flex items-center gap-2">
          <span className="hidden sm:block">Vesting Schedules</span>{" "}
          <FaCalendarCheck />
        </div>
        <div className="badge badge-info">{totalVestingSchedules}</div>
      </div>

      <div
        onClick={() => setVestingType(VestingType.TokenLock)}
        className={`tab flex items-center gap-1 ${vestingType === VestingType.TokenLock ? "tab-active" : ""}`}
      >
        <div className="flex items-center gap-2">
          <span className="hidden sm:block">Token Locks</span> <FaLock />
        </div>
        <div className="badge badge-info">{totalTokenLocks}</div>
      </div>

      <div
        onClick={() => setVestingType(VestingType.ScheduledPayment)}
        className={`tab flex items-center gap-1 ${vestingType === VestingType.ScheduledPayment ? "tab-active" : ""}`}
      >
        <div className="flex items-center gap-2">
          <span className="hidden sm:block">Scheduled Payments</span>{" "}
          <FaCalendarAlt />
        </div>
        <div className="badge badge-info">{totalScheduledPayments}</div>
      </div>
    </div>
  );
}
