import Link from "next/link";
import { FaLink } from "react-icons/fa";

export default function AddressBadge({ address }: { address: string }) {
  return (
    <Link
      target="_blank"
      className="flex badge badge-neutral badge-sm gap-1 hover:badge-md"
      href={`https://explorer.solana.com/address/${address}`}
    >
      {address.substring(0, 4) +
        "..." +
        address.substring(address.length - 4, address.length)}
      <FaLink />
    </Link>
  );
}
