import { FC, useMemo } from "react";
import { IconHome, IconListCheck } from "@tabler/icons-react";

import Image from "next/image";
import Link from "next/link";
import SocialBar from "./SocialBar";
import logo128 from "../assets/logo128.png";
import { routes } from "../utils/routes";
import useProgram from "../hooks/useProgram";
import { useRouter } from "next/router";

export const Footer: FC = () => {
  const { wallet } = useProgram();
  const router = useRouter();
  const links = useMemo(() => routes(wallet), [wallet]);

  return (
    <footer className="footer footer-center p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      <div className="flex flex-col items-center gap-2">
        <Image
          placeholder="blur"
          src={logo128}
          width={128}
          height={128}
          alt="Valhalla Logo"
        />
        <p>&copy; {new Date().getFullYear()} Valhalla. All Rights Reserved.</p>
      </div>

      <div className="flex flex-col gap-2">
        <h6>Quick Links</h6>
        <ul className="grid grid-cols-2 gap-2 text-xs">
          <li>
            <Link
              href={"/"}
              className={`flex items-center gap-2 link link-hover font-bold ${
                router?.pathname === "/" ? "link link-primary" : ""
              }`}
            >
              <IconHome />
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
              <IconListCheck className="inline" />
              Documentation
            </Link>
          </li>
        </ul>
      </div>

      <SocialBar />
    </footer>
  );
};
