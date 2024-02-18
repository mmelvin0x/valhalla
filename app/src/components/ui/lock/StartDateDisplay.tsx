import * as anchor from "@coral-xyz/anchor";

import { FaCalendar } from "react-icons/fa";

export default function StartDateDisplay({
  startDate,
}: {
  startDate: anchor.BN;
}) {
  return (
    <div className="flex items-center gap-1">
      {new Date(startDate.toNumber() * 1000).toLocaleString()} <FaCalendar />
    </div>
  );
}
