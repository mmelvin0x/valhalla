import { TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from "@solana/spl-token";

import { PublicKey } from "@solana/web3.js";
import useProgram from "./useProgram";
import { useQuery } from "@tanstack/react-query";

// TODO: Should we use DASAPI here?
export function useGetTokenAccounts({ address }: { address: PublicKey }) {
  const { connection } = useProgram();

  return useQuery({
    queryKey: [
      "get-token-accounts",
      { endpoint: connection.rpcEndpoint, address },
    ],
    queryFn: async () => {
      const [tokenAccounts, token2022Accounts] = await Promise.all([
        connection.getParsedTokenAccountsByOwner(address, {
          programId: TOKEN_PROGRAM_ID,
        }),
        connection.getParsedTokenAccountsByOwner(address, {
          programId: TOKEN_2022_PROGRAM_ID,
        }),
      ]);

      return [...tokenAccounts.value, ...token2022Accounts.value];
    },
  });
}
