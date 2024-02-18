import { Connection, PublicKey } from "@solana/web3.js";

import Image from "next/image";
import Link from "next/link";
import { getExplorerUrl } from "utils/explorer";
import { shortenAddress } from "utils/formatters";
import solscan from "../../../assets/solscan.png";

export default function TokenMintDisplay({
  connection,
  mint,
}: {
  connection: Connection;
  mint: PublicKey;
}) {
  return (
    <Link
      className="link link-secondary flex items-center gap-1"
      target="_blank"
      href={getExplorerUrl(connection.rpcEndpoint, mint)}
    >
      {shortenAddress(mint)}{" "}
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
