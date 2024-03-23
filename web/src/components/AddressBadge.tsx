import { IconLink } from "@tabler/icons-react";
import Link from "next/link";

export default function AddressBadge({ address }: { address: string }) {
  return (
    <Link
      target="_blank"
      className="flex badge badge-neutral badge-xs gap-1 hover:badge-sm"
      href={`https://explorer.solana.com/address/${address}`}
    >
      {address.substring(0, 4) +
        "..." +
        address.substring(address.length - 4, address.length)}
      <IconLink className="w-3 h-3" />
    </Link>
  );
}
