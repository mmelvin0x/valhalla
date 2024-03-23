import { IconCalendarCheck } from "@tabler/icons-react";

export default function StartDateDisplay({ startDate }: { startDate: Date }) {
  return (
    <div className="flex items-center gap-1">
      {new Date(startDate).toLocaleString()} <IconCalendarCheck />
    </div>
  );
}
