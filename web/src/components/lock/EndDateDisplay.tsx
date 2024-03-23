import { IconCalendarExclamation } from "@tabler/icons-react";

export default function EndDateDisplay({
  vestingEndDate,
}: {
  vestingEndDate: number;
}) {
  return (
    <div className="flex items-center gap-1">
      {new Date(vestingEndDate).toLocaleString()} <IconCalendarExclamation />
    </div>
  );
}
