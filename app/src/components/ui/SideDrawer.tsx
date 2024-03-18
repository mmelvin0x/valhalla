import {
  FaChartPie,
  FaClipboardList,
  FaHome,
  FaLock,
  FaSearch,
} from "react-icons/fa";

import Image from "next/image";
import Link from "next/link";
import SocialBar from "./SocialBar";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import logo128 from "../../assets/logo128.png";
import router from "next/router";
import { useMemo } from "react";
import useProgram from "program/useProgram";

export default function SideDrawer() {
  const { wallet } = useProgram();

  const links = useMemo(
    () => [
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
    ],
    [wallet?.publicKey],
  );

  return (
    <div className="min-h-full navlinks">
      <ul className="menu p-4 w-80 gap-1">
        <div className="flex flex-col items-center justify-center gap-8 my-12">
          <Image
            placeholder="blur"
            src={logo128}
            width={128}
            height={128}
            alt="Valhalla Logo"
          />

          <h2>Valhalla</h2>
        </div>

        <li>
          <Link
            href={"/"}
            className={`flex items-center gap-2 link link-hover font-bold text-lg ${
              router?.pathname === "/" ? "link link-primary" : ""
            }`}
          >
            <FaHome />
            Home
          </Link>
        </li>

        {links.map(({ pathname, content }) => (
          <li key={pathname}>
            <Link
              href={wallet?.connected ? pathname : "/"}
              className={`flex items-center gap-2 link link-hover font-bold text-lg ${
                router?.pathname === pathname ? "link link-primary" : ""
              }`}
            >
              {content}
            </Link>
          </li>
        ))}

        <li>
          <Link
            href={`https://docs.valhalla.so`}
            className={`flex items-center gap-2 link link-hover font-bold text-lg`}
          >
            <FaClipboardList className="inline" />
            Documentation
          </Link>
        </li>
      </ul>

      <div className="mt-8 flex flex-col items-center gap-8">
        <WalletMultiButton />
        <SocialBar showText={false} iconClassName="w-6 h-6" iconGap="gap-1" />
      </div>
    </div>
  );
}
