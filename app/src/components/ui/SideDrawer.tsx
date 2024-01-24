import {
  FaCalendar,
  FaChartPie,
  FaClipboardList,
  FaHome,
  FaLock,
  FaSearch,
  FaStopwatch,
} from "react-icons/fa";

import Image from "next/image";
import Link from "next/link";
import SocialBar from "./SocialBar";
import { VestingType } from "program";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
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
        pathname: "/search",
        content: (
          <>
            <FaSearch className="inline" />
            Search Token Locks
          </>
        ),
      },
      {
        pathname: `/create?vestingType=${VestingType.VestingSchedule}`,
        content: (
          <>
            <FaCalendar className="inline" />
            Vesting Schedules
          </>
        ),
      },
      {
        pathname: `/create?vestingType=${VestingType.TokenLock}`,
        content: (
          <>
            <FaLock className="inline" />
            Token Locks
          </>
        ),
      },
      {
        pathname: `/create?vestingType=${VestingType.ScheduledPayment}`,
        content: (
          <>
            <FaStopwatch className="inline" />
            Scheduled Payments
          </>
        ),
      },
    ],
    [wallet?.publicKey],
  );

  return (
    <ul className="menu p-2 w-60 gap-2 min-h-full navlinks">
      <div className="flex flex-col items-center justify-center gap-8 my-8">
        <Image
          src="/logo128.png"
          width={128}
          height={128}
          alt="Valhalla Logo"
        />

        <h2>Valhalla</h2>
      </div>
      <li>
        <Link
          href={"/"}
          className={`flex items-center gap-2 link link-hover font-bold ${
            router?.pathname === "/" ? "link link-primary" : ""
          }`}
        >
          <FaHome />
          Home
        </Link>
      </li>
      {links.map(({ pathname, content }) => (
        <li key={pathname}>
          {wallet?.connected ? (
            <Link
              href={wallet?.connected ? pathname : "/"}
              className={`flex items-center gap-2 link link-hover font-bold ${
                router?.pathname === pathname ? "link link-primary" : ""
              }`}
            >
              {content}
            </Link>
          ) : (
            <div className="flex items-center gap-2 text-gray-400 font-bold">
              {content}
            </div>
          )}
        </li>
      ))}

      <li>
        <Link
          href={`https://docs.valhalla.so`}
          className={`flex items-center gap-2 link link-hover font-bold`}
        >
          <FaClipboardList className="inline" />
          Documentation
        </Link>
      </li>

      <li className="items-center">
        <WalletMultiButton />
      </li>

      <div className="mx-auto mt-8">
        <SocialBar showText={false} iconClassName="w-6 h-6" iconGap="gap-1" />
      </div>
    </ul>
  );
}
