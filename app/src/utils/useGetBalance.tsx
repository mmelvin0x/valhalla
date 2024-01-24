import { PublicKey } from "@solana/web3.js";
import useProgram from "program/useProgram";
import { useQuery } from "@tanstack/react-query";

export function useGetBalance({ address }: { address: PublicKey }) {
  const { connection } = useProgram();

  return useQuery({
    queryKey: ["get-balance", { endpoint: connection.rpcEndpoint, address }],
    queryFn: () => connection.getBalance(address),
  });
}
