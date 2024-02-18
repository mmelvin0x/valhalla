import * as anchor from "@coral-xyz/anchor";

import { FaCalendar } from "react-icons/fa";

export default function EndDateDisplay({
  startDate,
  totalVestingDuration,
}: {
  startDate: anchor.BN;
  totalVestingDuration: anchor.BN;
}) {
  const _startDate = new Date(startDate.toNumber() * 1000);
  const endDate = new Date(
    _startDate.getTime() + totalVestingDuration.toNumber() * 1000,
  );

  return (
    <div className="flex items-center gap-1">
      {endDate.toLocaleString()} <FaCalendar />
    </div>
  );
}
