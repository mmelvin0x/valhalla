import * as anchor from "@coral-xyz/anchor";

import { FaCalendar } from "react-icons/fa";
import { displayTime } from "utils/formatters";

export default function PayoutIntervalDisplay({
  payoutInterval,
}: {
  payoutInterval: anchor.BN;
}) {
  return (
    <div className="flex items-center gap-1">
      {payoutInterval.toNumber() === 0
        ? "No interval"
        : displayTime(payoutInterval.toNumber())}{" "}
      <FaCalendar />
    </div>
  );
}
