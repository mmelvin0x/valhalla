import { FC } from "react";
import Link from "next/link";
import { getExplorerUrl } from "@/src/utils/explorer";
import { shortenSignature } from "@valhalla/lib";
import useProgram from "@/src/utils/useProgram";

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
