import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";

import { useGetBalance } from "utils/useGetBalance";

export function AccountBalance({
  address,
  size = "text-5xl",
}: {
  address: PublicKey;
  size: string;
}) {
  const query = useGetBalance({ address });

  return (
    <div>
      <h1
        className={`${size} font-bold cursor-pointer`}
        onClick={() => query.refetch()}
      >
        {query.data ? (
          <span>
            {Math.round((query.data / LAMPORTS_PER_SOL) * 100000) / 100000}
          </span>
        ) : (
          "..."
        )}{" "}
        SOL
      </h1>
    </div>
  );
}
