import { PublicKey } from "@solana/web3.js";
import { useGetTokenAccountBalance } from "utils/useGetTokenAccountBalance";

export function AccountTokenBalance({ address }: { address: PublicKey }) {
  const query = useGetTokenAccountBalance({ address });
  return query.isLoading ? (
    <span className="loading loading-spinner"></span>
  ) : query.data ? (
    <div>{query.data?.value.uiAmount?.toLocaleString()}</div>
  ) : (
    <div>Error</div>
  );
}
