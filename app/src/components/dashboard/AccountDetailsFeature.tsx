import { AccountTokens } from "./ui/AccountTokens";
import { AccountTransactions } from "./ui/AccountTransactions";
import { PublicKey } from "@solana/web3.js";
import { useMemo } from "react";
import { useRouter } from "next/router";

export default function AccountDetailsFeature() {
  const router = useRouter();

  const address = useMemo(() => {
    if (!router.query.address) {
      return;
    }
    try {
      return new PublicKey(router.query.address);
    } catch (e) {
      console.error(`Invalid public key`, e);
    }
  }, [router.query.address]);

  if (!address) {
    return <div>Error loading account</div>;
  }

  return (
    <>
      <AccountTokens address={address} />
      <AccountTransactions address={address} />
    </>
  );
}
