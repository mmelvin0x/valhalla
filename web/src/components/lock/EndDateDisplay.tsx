import { useMemo } from "react";

export default function EndDateDisplay({
  vestingEndDate,
}: {
  vestingEndDate: Date | string | number;
}) {
  const date = useMemo(
    () => new Date(vestingEndDate).toLocaleString(),
    [vestingEndDate]
  );
  return <div className="flex items-center gap-1">{date}</div>;
}
