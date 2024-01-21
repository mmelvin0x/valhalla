import {
  FaCalendar,
  FaChartPie,
  FaHome,
  FaLock,
  FaSearch,
  FaStopwatch,
} from "react-icons/fa";

import Image from "next/image";
import Link from "next/link";
import { VestingType } from "program";
import router from "next/router";
import { useMemo } from "react";

export default function SideDrawer() {
  const links = useMemo(
    () => [
      {
        pathname: "/",
        content: (
          <>
            <FaHome className="inline" />
            Home
          </>
        ),
      },
      {
        pathname: "/dashboard",
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
    [],
  );

  return (
    <>
      <ul className="menu p-4 w-80 gap-4 min-h-full navlinks">
        <div className="flex flex-col items-center justify-center gap-8 my-8">
          <Image
            src="/logo256.png"
            width={200}
            height={200}
            alt="Valhalla Logo"
          />

          <h1>Valhalla</h1>
        </div>
        {links.map(({ pathname, content }) => (
          <li key={pathname}>
            <Link
              href={pathname}
              className={`flex items-center gap-2 text-xl link link-hover font-bold ${
                router?.pathname === pathname ? "link link-primary" : ""
              }`}
            >
              {content}
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
