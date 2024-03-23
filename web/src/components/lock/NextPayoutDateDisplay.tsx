import { IconCircleCheck } from "@tabler/icons-react";

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
        Payments complete <IconCircleCheck />{" "}
      </span>
    );
  }

  if (nextPayoutDate < new Date()) {
    return <span className="text-error font-bold">Payout overdue</span>;
  }

  return <span>{nextPayoutDate.toLocaleString()}</span>;
}
