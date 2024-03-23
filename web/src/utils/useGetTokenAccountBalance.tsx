import { PublicKey } from "@solana/web3.js";
import useProgram from "../contexts/useProgram";
import { useQuery } from "@tanstack/react-query";

export function useGetTokenAccountBalance({ address }: { address: PublicKey }) {
  const { connection } = useProgram();

  return useQuery({
    queryKey: [
      "get-token-account-balance",
      { endpoint: connection.rpcEndpoint, account: address.toString() },
    ],
    queryFn: () => connection.getTokenAccountBalance(address),
  });
}
