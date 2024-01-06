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
      <div className="navbar flex flex-row md:mb-2 bg-gradient-to-r from-white to-primary">
        <div className="navbar-start">
          <details className="dropdown">
            <summary className="m-1 btn btn-circle btn-outline flex gap-2 items-center shadow-xl">
              <Image src="/logo64.png" alt="logo" width={48} height={48} />{" "}
            </summary>
            <ul className="p-2 shadow menu dropdown-content z-[1] bg-base-100 rounded-box w-52">
              <li>
                <Link
                  href="/"
                  className={`flex items-center gap-1 link link-hover font-bold ${
                    router.pathname === "/" ? "link underline" : ""
                  }`}
                >
                  <FaHome className="inline" />
                  Home
                </Link>
              </li>
              <li>
                <Link
                  href="/locks"
                  className={`flex items-center gap-1 link link-hover font-bold ${
                    router.pathname === "/locks" ? "link underline" : ""
                  }`}
                >
                  <FaLockOpen className="inline" />
                  Token Locks
                </Link>
              </li>
              {connected && (
                <>
                  <li>
                    <Link
                      href={`/locks/create`}
                      className={`flex items-center gap-1 link link-hover font-bold ${
                        router.pathname === "/locks/create"
                          ? "link underline"
                          : ""
                      }`}
                    >
                      <FaPlusCircle className="inline" />
                      Create a Lock
                    </Link>
                  </li>
                  <li>
                    <Link
                      href={`/${publicKey?.toBase58()}/locks`}
                      className={`flex items-center gap-1 link link-hover font-bold ${
                        router.pathname === "/[user]/locks"
                          ? "link underline"
                          : ""
                      }`}
                    >
                      <FaUserLock className="inline" />
                      Your Locks
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </details>
          <h3 className="degen-locker">Valhalla</h3>
        </div>

        {/* Nav Links */}
        <div className="hidden lg:inline lg:navbar-center">
          <div className="flex gap-8 items-stretch">
            <Link
              href="/"
              className={`flex items-center gap-1 link link-hover font-bold ${
                router.pathname === "/" ? "link underline" : ""
              }`}
            >
              <FaHome className="inline" />
              Home
            </Link>
            <Link
              href="/locks"
              className={`flex items-center gap-1 link link-hover font-bold ${
                router.pathname === "/locks" ? "link underline" : ""
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
                    router.pathname === "/locks/create" ? "link underline" : ""
                  }`}
                >
                  <FaPlusCircle className="inline" />
                  Create a Lock
                </Link>

                <Link
                  href={`/${publicKey?.toBase58()}/locks`}
                  className={`flex items-center gap-1 link link-hover font-bold ${
                    router.pathname === "/[user]/locks" ? "link underline" : ""
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
