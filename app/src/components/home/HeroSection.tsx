import Link from "next/link";
import Image from "next/image";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

export default function HeroSection() {
  const { connected } = useWallet();

  return (
    <div className="hero py-10 bg-gradient-to-br from-primary to-white">
      <div className="mx-auto">
        <div className="flex flex-col md:flex-row gap-20 items-center justify-between">
          <div className="flex-1 card bg-base-100 shadow-xl">
            <div className="card-body">
              <h1 className="degen-locker">Lock your tokens</h1>
              <p className="text-xl">Lock your tokens and earn rewards</p>
              <p className="prose">
                Gain the chain's trust by locking your LP tokens
              </p>
              <div className="flex gap-4 mt-4">
                <Link className="btn btn-primary" href="/locks/create">
                  Lock LP Tokens
                </Link>
                {connected ? (
                  <Link className="btn btn-secondary" href="/locks">
                    View locked tokens
                  </Link>
                ) : (
                  <WalletMultiButton />
                )}
              </div>
            </div>
          </div>

          <Image width={350} height={350} src="/hero.png" alt="Valhalla Hero" />
        </div>
      </div>
    </div>
  );
}
