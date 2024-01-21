import { FaDiscord, FaMedium, FaTelegram, FaTwitter } from "react-icons/fa";

import Link from "next/link";

export default function SocialBar({ showText = true }: { showText?: boolean }) {
  return (
    <div className="text-center flex flex-col gap-6 mx-auto">
      <div className="flex justify-center gap-6">
        <Link
          target="_blank"
          rel="noreferrer"
          href="https://twitter.com/Valhalla_so"
          className="btn btn-ghost btn-circle"
        >
          <FaTwitter className="w-8 h-8" />
        </Link>
        <Link
          target="_blank"
          rel="noreferrer"
          href="https://telegram.com/valhalla"
          className="btn btn-ghost btn-circle"
        >
          <FaTelegram className="w-8 h-8" />
        </Link>
        <Link
          target="_blank"
          rel="noreferrer"
          href="https://medium.com/valhalla"
          className="btn btn-ghost btn-circle"
        >
          <FaMedium className="w-8 h-8" />
        </Link>
        <Link
          target="_blank"
          rel="noreferrer"
          href="https://discord.com/valhalla"
          className="btn btn-ghost btn-circle"
        >
          <FaDiscord className="w-8 h-8" />
        </Link>
      </div>

      {showText && (
        <p className="text-center">
          Follow our socials for the latest updates.
        </p>
      )}
    </div>
  );
}
