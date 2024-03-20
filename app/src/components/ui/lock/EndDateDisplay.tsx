import * as anchor from "@coral-xyz/anchor";

import { FaCalendar } from "react-icons/fa";

export default function EndDateDisplay({
  startDate,
  totalVestingDuration,
}: {
  startDate: Date;
  totalVestingDuration: number;
}) {
  const _startDate = new Date(startDate);
  const endDate = new Date(_startDate.getTime() + totalVestingDuration * 1000);

  return (
    <div className="flex items-center gap-1">
      {endDate.toLocaleString()} <FaCalendar />
    </div>
  );
}
