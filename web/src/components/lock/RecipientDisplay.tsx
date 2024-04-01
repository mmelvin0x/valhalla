import { ValhallaVault, shortenAddress } from "@valhalla/lib";

import Image from "next/image";
import Link from "next/link";
import { ReactNode } from "react";
import { getExplorerUrl } from "@/src/utils/explorer";
import solscan from "../../assets/solscan.png";

export default function RecipientDisplay({
  recipient,
  connection,
}: Partial<ValhallaVault>): ReactNode {
  return (
    <Link
      className="link link-secondary flex items-center gap-1"
      target="_blank"
      href={getExplorerUrl(connection?.rpcEndpoint, recipient!)}
    >
      {shortenAddress(recipient)}{" "}
      <Image
        placeholder="blur"
        src={solscan}
        width={14}
        height={14}
        alt="solscan"
      />
    </Link>
  );
}
