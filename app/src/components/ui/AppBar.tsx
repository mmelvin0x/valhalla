import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { FC, PropsWithChildren, useMemo } from "react";
import { FaChartPie, FaHome, FaPlusCircle, FaSearch } from "react-icons/fa";

export const AppBar: FC<PropsWithChildren> = (props) => {
  const { connected } = useWallet();
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
      <div className="navbar flex bg-gradient-to-r from-white to-primary">
        <div className="navbar-start">
          <details className="dropdown">
            <summary className="m-1 btn btn-ghost flex gap-1 items-center">
              <Image src="/logo64.png" alt="logo" width={36} height={36} />{" "}
              <h3 className="hidden md:block">Valhalla</h3>
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
                  href="/dashboard"
                  className={`flex items-center gap-1 link link-hover font-bold ${
                    router.pathname === "/" ? "link underline" : ""
                  }`}
                >
                  <FaChartPie className="inline" />
                  Dashboard
                </Link>
              </li>
              {connected && (
                <>
                  <li>
                    <Link
                      href={`/create`}
                      className={`flex items-center gap-1 link link-hover font-bold ${
                        router.pathname === "/create" ? "link underline" : ""
                      }`}
                    >
                      <FaPlusCircle className="inline" />
                      Create a Lock
                    </Link>
                  </li>
                </>
              )}
              <li>
                <Link
                  href="/locks"
                  className={`flex items-center gap-1 link link-hover font-bold ${
                    router.pathname === "/locks" ? "link underline" : ""
                  }`}
                >
                  <FaSearch className="inline" />
                  Search
                </Link>
              </li>
            </ul>
          </details>
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
              href="/dashboard"
              className={`flex items-center gap-1 link link-hover font-bold ${
                router.pathname === "/dashboard" ? "link underline" : ""
              }`}
            >
              <FaChartPie className="inline" />
              Dashboard
            </Link>

            {connected && (
              <>
                <Link
                  href={`/create`}
                  className={`flex items-center gap-1 link link-hover font-bold ${
                    router.pathname === "/create" ? "link underline" : ""
                  }`}
                >
                  <FaPlusCircle className="inline" />
                  Create a Lock
                </Link>
              </>
            )}
            <Link
              href="/locks"
              className={`flex items-center gap-1 link link-hover font-bold ${
                router.pathname === "/locks" ? "link underline" : ""
              }`}
            >
              <FaSearch className="inline" />
              Search
            </Link>
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
