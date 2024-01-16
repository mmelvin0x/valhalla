import Image from "next/image";
import { FC } from "react";

export const Footer: FC = () => {
  return (
    <footer className="footer footer-center p-4 shadow-xl flex justify-between bg-gradient-to-r from-white to-primary">
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
