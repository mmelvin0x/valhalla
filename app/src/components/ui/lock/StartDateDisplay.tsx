import * as anchor from "@coral-xyz/anchor";

import { FaCalendar } from "react-icons/fa";

export default function StartDateDisplay({ startDate }: { startDate: Date }) {
  return (
    <div className="flex items-center gap-1">
      {new Date(startDate).toLocaleString()} <FaCalendar />
    </div>
  );
}
