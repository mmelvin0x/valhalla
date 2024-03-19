import Link from "next/link";
import { PublicKey } from "@solana/web3.js";

export default function NameDisplay({
  id,
  name,
}: {
  id: PublicKey;
  name: string;
}) {
  return (
    <Link
      className="link link-secondary flex items-center gap-1 font-bold text-xl"
      target="_blank"
      href={`/vesting/${id.toBase58()}`}
    >
      {name}{" "}
    </Link>
  );
}
