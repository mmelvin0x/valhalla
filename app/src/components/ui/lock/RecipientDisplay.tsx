import BaseModel from "models/models";
import Image from "next/image";
import Link from "next/link";
import { getExplorerUrl } from "utils/explorer";
import { shortenAddress } from "utils/formatters";
import solscan from "../../../assets/solscan.png";

export default function RecipientDisplay({
  recipient,
  connection,
}: Partial<BaseModel>) {
  return (
    <Link
      className="link link-secondary flex items-center gap-1"
      target="_blank"
      href={getExplorerUrl(connection.rpcEndpoint, recipient)}
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
