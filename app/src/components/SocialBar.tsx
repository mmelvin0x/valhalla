import Link from "next/link";
import { FaTwitter, FaTelegram, FaMedium, FaDiscord } from "react-icons/fa";

export default function SocialBar() {
  return (
    <div className="py-10">
      <div className="text-center flex flex-col gap-6">
        <div className="flex justify-center gap-6">
          <Link
            target="_blank"
            rel="noreferrer"
            href="https://twitter.com/valhalla"
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

        <p className="text-center">
          Follow our socials for the latest updates.
        </p>
      </div>
    </div>
  );
}
