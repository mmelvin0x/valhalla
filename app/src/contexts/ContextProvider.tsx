import { Adapter, WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { clusterApiUrl } from "@solana/web3.js";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import { FC, ReactNode, useMemo } from "react";
import { AutoConnectProvider } from "./AutoConnectProvider";

const ReactUIWalletModalProviderDynamic = dynamic(
  async () =>
    (await import("@solana/wallet-adapter-react-ui")).WalletModalProvider,
  { ssr: false },
);

const WalletContextProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const router = useRouter();
  const network = process.env.NEXT_PUBLIC_NETWORK!.includes("mainnet")
    ? WalletAdapterNetwork.Mainnet
    : WalletAdapterNetwork.Devnet;
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);
  const wallets = useMemo(() => [] as Adapter[], []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect={true}>
        <ReactUIWalletModalProviderDynamic>
          {children}
        </ReactUIWalletModalProviderDynamic>
      </WalletProvider>
    </ConnectionProvider>
  );
};

export const ContextProvider: FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <AutoConnectProvider>
      <WalletContextProvider>{children}</WalletContextProvider>
    </AutoConnectProvider>
  );
};
