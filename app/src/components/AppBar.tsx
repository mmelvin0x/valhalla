import { FC, PropsWithChildren, useMemo } from "react";

import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import Image from "next/image";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import Link from "next/link";
import { useRouter } from "next/router";
import { FaHome, FaLockOpen, FaPlusCircle, FaUserLock } from "react-icons/fa";

export const AppBar: FC<PropsWithChildren> = (props) => {
  const { connected, publicKey } = useWallet();
  const { connection } = useConnection();
  const router = useRouter();
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
      <div className="navbar flex flex-row md:mb-2 bg-gradient-to-r from-white to-base-content">
        <Link href="/" className="navbar-start gap-2">
          <Image src="/logo64.png" alt="logo" width={48} height={48} />{" "}
          <h3 className="degen-locker">Valhalla</h3>
        </Link>

        {/* Nav Links */}
        <div className="hidden md:inline md:navbar-center">
          <div className="flex gap-8 items-stretch">
            <Link
              href="/"
              className={`flex items-center gap-1 link link-hover font-bold ${
                router.pathname === "/" ? "link-accent" : ""
              }`}
            >
              <FaHome className="inline" />
              Home
            </Link>
            <Link
              href="/locks"
              className={`flex items-center gap-1 link link-hover font-bold ${
                router.pathname === "/locks" ? "link-accent" : ""
              }`}
            >
              <FaLockOpen className="inline" />
              Locks
            </Link>
            {connected && (
              <>
                <Link
                  href={`/locks/create`}
                  className={`flex items-center gap-1 link link-hover font-bold ${
                    router.pathname === "/locks/create" ? "link-accent" : ""
                  }`}
                >
                  <FaPlusCircle className="inline" />
                  Create a Lock
                </Link>

                <Link
                  href={`/${publicKey?.toBase58()}/locks`}
                  className={`flex items-center gap-1 link link-hover font-bold ${
                    router.pathname === "/[user]/locks" ? "link-accent" : ""
                  }`}
                >
                  <FaUserLock className="inline" />
                  Your Locks
                </Link>
              </>
            )}
          </div>
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
      {props.children}
    </div>
  );
};
