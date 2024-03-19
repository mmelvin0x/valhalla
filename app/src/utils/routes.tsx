import { FaChartPie, FaDirections, FaLock, FaSearch } from "react-icons/fa";

import { WalletContextState } from "@solana/wallet-adapter-react";

export const routes = (wallet: WalletContextState) => [
  {
    pathname: `/dashboard/${wallet?.publicKey?.toBase58()}`,
    content: (
      <>
        <FaChartPie className="inline" />
        Dashboard
      </>
    ),
  },
  {
    pathname: `/create`,
    content: (
      <>
        <FaLock className="inline" />
        Create Vaults
      </>
    ),
  },
  {
    pathname: "/vaults/all",
    content: (
      <>
        <FaSearch className="inline" />
        All Vaults
      </>
    ),
  },
  {
    pathname: "/governance",
    content: (
      <>
        <FaDirections className="inline" />
        Governance
      </>
    ),
  },
];
