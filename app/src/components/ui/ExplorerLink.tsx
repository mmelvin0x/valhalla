import Link from "next/link";
import { getExplorerUrl } from "utils/explorer";
import useProgram from "program/useProgram";

export function ExplorerLink({
  address,
  label,
  className,
}: {
  address: string;
  label: string;
  className?: string;
}) {
  const { connection } = useProgram();

  return (
    <Link
      href={getExplorerUrl(connection.rpcEndpoint, address)}
      target="_blank"
      rel="noopener noreferrer"
      className={className ? className : `link`}
    >
      {label}
    </Link>
  );
}
