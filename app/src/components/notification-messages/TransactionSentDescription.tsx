import Link from "next/link";
import { LockAccount } from "program/accounts";
import { FC } from "react";
import { getExplorerUrl } from "utils/explorer";
import { shortenSignature } from "utils/formatters";

const TransactionSentDescription: FC<{
  lock: LockAccount;
  signature: string;
}> = ({ lock, signature }) => {
  return (
    <p>
      Transaction has been sent to the network. Check it at{" "}
      <Link
        className="link link-primary"
        href={getExplorerUrl(lock.endpoint, signature)}
      >
        {shortenSignature(signature)}
      </Link>
    </p>
  );
};

export default TransactionSentDescription;
