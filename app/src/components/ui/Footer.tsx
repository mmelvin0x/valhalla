import { FC } from "react";
import Image from "next/image";

export const Footer: FC = () => {
  return (
    <footer className="footer footer-center p-4 shadow-xl flex justify-between">
      <p>&copy; {new Date().getFullYear()} Valhalla. All Rights Reserved.</p>
      <div className="flex items-center gap-1 text-white">
        <Image
          alt="Solana"
          className="inline"
          src="/solanaLogo.png"
          width={2584 / 25}
          height={384 / 25}
        />
      </div>
    </footer>
  );
};
