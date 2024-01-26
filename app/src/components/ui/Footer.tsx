import { FC, useMemo } from "react";
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
import useProgram from "program/useProgram";
import { useRouter } from "next/router";

export const Footer: FC = () => {
  const { wallet } = useProgram();
  const router = useRouter();
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
    <footer className="footer footer-center p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
      <div className="flex flex-col items-center gap-2">
        <Image
          src={"/logo128.png"}
          width={128}
          height={128}
          alt="Valhalla Logo"
        />
        <p>&copy; {new Date().getFullYear()} Valhalla. All Rights Reserved.</p>
      </div>

      <div className="flex flex-col gap-2">
        <h6>Quick Links</h6>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
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
        </ul>
      </div>

      <SocialBar />
    </footer>
  );
};
