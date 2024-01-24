import { PublicKey } from "@solana/web3.js";
import useProgram from "program/useProgram";
import { useQuery } from "@tanstack/react-query";

export function useGetSignatures({ address }: { address: PublicKey }) {
  const { connection } = useProgram();

  return useQuery({
    queryKey: ["get-signatures", { endpoint: connection.rpcEndpoint, address }],
    queryFn: () => connection.getConfirmedSignaturesForAddress2(address),
  });
}
