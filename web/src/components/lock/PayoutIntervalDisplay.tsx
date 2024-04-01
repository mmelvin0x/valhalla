import { IconCalendarRepeat } from "@tabler/icons-react";
import { displayTime } from "@valhalla/lib";
import { useMemo } from "react";

export default function PayoutIntervalDisplay({
  payoutInterval,
}: {
  payoutInterval: number;
}) {
  const interval = useMemo(
    () => displayTime(payoutInterval / 1000),
    [payoutInterval]
  );
  return (
    <div className="flex items-center gap-1">
      {interval} <IconCalendarRepeat />
    </div>
  );
}
