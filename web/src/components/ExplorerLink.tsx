import Link from "next/link";
import { getExplorerUrl } from "../utils/explorer";
import useProgram from "../utils/useProgram";

export function ExplorerLink({
  address,
  label,
  type,
  className,
}: {
  address: string;
  label: string;
  type?: "address" | "tx" | "block" | "inspector";
  className?: string;
}) {
  const { connection } = useProgram();

  return (
    <Link
      href={getExplorerUrl(connection.rpcEndpoint, address, type)}
      target="_blank"
      rel="noopener noreferrer"
      className={className ? className : `link`}
    >
      {label}
    </Link>
  );
}
