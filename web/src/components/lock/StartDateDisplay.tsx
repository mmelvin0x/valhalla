import { useMemo } from "react";

export default function StartDateDisplay({
  startDate,
}: {
  startDate: Date | string | number;
}) {
  const date = useMemo(() => new Date(startDate).toLocaleString(), [startDate]);
  return <div className="flex items-center gap-1">{date}</div>;
}
