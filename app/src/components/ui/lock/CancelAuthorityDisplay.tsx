import { Connection, PublicKey } from "@solana/web3.js";

import { Authority } from "program";
import Image from "next/image";
import Link from "next/link";
import { getExplorerUrl } from "utils/explorer";
import { shortenAddress } from "utils/formatters";
import solscan from "../../../assets/solscan.png";

export default function CancelAuthorityDisplay({
  authority,
  connection,
  creator,
  recipient,
}: {
  authority: Authority;
  connection: Connection;
  creator: PublicKey;
  recipient: PublicKey;
}) {
  switch (authority) {
    case Authority.Creator:
      return (
        <Link
          className="link link-secondary flex items-center gap-1"
          target="_blank"
          href={getExplorerUrl(connection.rpcEndpoint, creator)}
        >
          {shortenAddress(creator)}{" "}
          <Image
            placeholder="blur"
            src={solscan}
            width={14}
            height={14}
            alt="solscan"
          />
        </Link>
      );
    case Authority.Recipient:
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
    case Authority.Both:
      return (
        <div className="flex flex-col gap-1">
          <Link
            className="link link-secondary flex items-center gap-1"
            target="_blank"
            href={getExplorerUrl(connection.rpcEndpoint, creator)}
          >
            {shortenAddress(creator)}{" "}
            <Image
              placeholder="blur"
              src={solscan}
              width={14}
              height={14}
              alt="solscan"
            />
          </Link>

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
        </div>
      );

    default:
      return "No one";
  }
}
