import Link from "next/link";
import { FC } from "react";
import { getExplorerUrl } from "utils/explorer";
import { shortenSignature } from "utils/formatters";
import useProgram from "hooks/useProgram";

const TransactionSentDescription: FC<{
  signature: string;
}> = ({ signature }) => {
  const { connection } = useProgram();
  return (
    <p>
      Transaction has been sent to the network. Check it at{" "}
      <Link
        className="link link-primary"
        href={getExplorerUrl(connection.rpcEndpoint, signature)}
      >
        {shortenSignature(signature)}
      </Link>
    </p>
  );
};

export default TransactionSentDescription;
