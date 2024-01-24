import { FaDiscord, FaMedium, FaTelegram, FaTwitter } from "react-icons/fa";

import Link from "next/link";

export default function SocialBar({
  showText = true,
  iconClassName = "w-8 h-8",
  iconGap = "gap-6",
}: {
  showText?: boolean;
  iconClassName?: string;
  iconGap?: string;
}) {
  return (
    <div className="text-center flex flex-col gap-6 mx-auto">
      <div className={`flex justify-center ${iconGap}`}>
        <Link
          target="_blank"
          rel="noreferrer"
          href="https://twitter.com/Valhalla_so"
          className="btn btn-ghost btn-circle"
        >
          <FaTwitter className={iconClassName} />
        </Link>
        <Link
          target="_blank"
          rel="noreferrer"
          href="https://telegram.com/valhalla"
          className="btn btn-ghost btn-circle"
        >
          <FaTelegram className={iconClassName} />
        </Link>
        <Link
          target="_blank"
          rel="noreferrer"
          href="https://medium.com/valhalla"
          className="btn btn-ghost btn-circle"
        >
          <FaMedium className={iconClassName} />
        </Link>
        <Link
          target="_blank"
          rel="noreferrer"
          href="https://discord.com/valhalla"
          className="btn btn-ghost btn-circle"
        >
          <FaDiscord className={iconClassName} />
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
