import { FC, PropsWithChildren, useMemo } from "react";

import Image from "next/image";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useConnection } from "@solana/wallet-adapter-react";

export const AppBar: FC<PropsWithChildren> = (props) => {
  const { connection } = useConnection();
  const network = useMemo(() => {
    if (!connection) return "Not Connected";
    return connection.rpcEndpoint.toLowerCase().includes("mainnet")
      ? "Mainnet-beta"
      : connection.rpcEndpoint.toLowerCase().includes("devnet")
        ? "Devnet"
        : "Local";
  }, [connection]);

  return (
    <div>
      {/* NavBar / Header */}
      <div className="navbar flex">
        <div className="navbar-start">
          <label
            htmlFor="my-drawer-2"
            className="flex items-center gap-1 cursor-pointer drawer-button lg:hidden"
          >
            <Image src="/logo64.png" alt="logo" width={36} height={36} />{" "}
            <h3>Valhalla</h3>
          </label>
        </div>

        {/* Wallet & Settings */}
        <div className="navbar-end">
          <span
            className={`hidden sm:inline mx-2 text-sm badge ${
              network.toLowerCase().includes("mainnet")
                ? "badge-primary"
                : "badge-warning"
            }`}
          >
            {network}
          </span>
          <WalletMultiButton />
        </div>
      </div>
    </div>
  );
};
