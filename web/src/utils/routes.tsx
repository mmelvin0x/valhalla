import {
  IconDashboard,
  IconDirectionSign,
  IconLockCog,
  IconSearch,
} from "@tabler/icons-react";

import { WalletContextState } from "@solana/wallet-adapter-react";

export const routes = (wallet: WalletContextState) => [
  {
    pathname: `/dashboard`,
    content: (
      <>
        <IconDashboard className="inline" />
        Dashboard
      </>
    ),
  },
  {
    pathname: `/create`,
    content: (
      <>
        <IconLockCog className="inline" />
        Create Vaults
      </>
    ),
  },
  {
    pathname: "/vaults/all",
    content: (
      <>
        <IconSearch className="inline" />
        All Vaults
      </>
    ),
  },
  {
    pathname: "/governance",
    content: (
      <>
        <IconDirectionSign className="inline" />
        Governance
      </>
    ),
  },
];
