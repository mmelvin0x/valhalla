import {
  IconBrandDiscord,
  IconBrandMedium,
  IconBrandTelegram,
  IconBrandTwitter,
} from "@tabler/icons-react";

import Link from "next/link";

export default function SocialBar({
  showText = true,
  iconClassName = "w-8 h-8",
  iconGap = "gap-6",
  className = "",
}: {
  showText?: boolean;
  iconClassName?: string;
  iconGap?: string;
  className?: string;
}) {
  return (
    <div className={`text-center flex flex-col gap-6 mx-auto ${className}`}>
      <div className={`flex justify-center ${iconGap}`}>
        <Link
          target="_blank"
          rel="noreferrer"
          href="https://twitter.com/Valhalla_so"
          className="btn btn-ghost btn-circle"
        >
          <IconBrandTwitter className={iconClassName} />
        </Link>
        <Link
          target="_blank"
          rel="noreferrer"
          href="#"
          className="btn btn-ghost btn-circle"
        >
          <IconBrandTelegram className={iconClassName} />
        </Link>
        <Link
          target="_blank"
          rel="noreferrer"
          href="https://medium.com/valhalla_so"
          className="btn btn-ghost btn-circle"
        >
          <IconBrandMedium className={iconClassName} />
        </Link>
        <Link
          target="_blank"
          rel="noreferrer"
          href="#"
          className="btn btn-ghost btn-circle"
        >
          <IconBrandDiscord className={iconClassName} />
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
