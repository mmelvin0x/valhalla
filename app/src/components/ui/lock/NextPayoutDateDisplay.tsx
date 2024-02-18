import { FaCheckCircle } from "react-icons/fa";

export default function NextPayoutDateDisplay({
  paymentsComplete,
  nextPayoutDate,
}: {
  paymentsComplete: boolean;
  nextPayoutDate: Date;
}) {
  if (paymentsComplete) {
    return (
      <span className="flex items-center gap-1 text-success">
        Payments complete <FaCheckCircle />{" "}
      </span>
    );
  }

  return <span>{nextPayoutDate.toLocaleString()}</span>;
}
