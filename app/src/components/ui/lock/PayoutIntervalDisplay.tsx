import { FaCalendar } from "react-icons/fa";

export default function PayoutIntervalDisplay({
  payoutInterval,
}: {
  payoutInterval: string;
}) {
  return (
    <div className="flex items-center gap-1">
      {payoutInterval} <FaCalendar />
    </div>
  );
}
