import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import SocialBar from "components/ui/SocialBar";
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import useProgram from "program/useProgram";

export default function HomeFeature() {
  const { connected } = useProgram();

  return (
    <div>
      <Head>
        <title>Valhalla - Token Vesting Solutions</title>
        <meta
          name="description"
          content="Token Vesting and Locks on Solana. Lock your tokens until Valhalla."
        />
      </Head>

      {/* Hero Section */}
      <div className="py-20">
        <div className="grid grid-cols-1 p-4 md:grid-cols-2">
          <div className="flex flex-col items-center justify-center gap-4 text-center">
            <h1>Valhalla</h1>

            <p className="text-xl font-bold">
              Token 2022 Compatible Vesting Solutions
            </p>
            <p className="prose">
              Token Locks - Vesting Schedules - Micro Payments
            </p>
            <div className="card-actions">
              <Link className="btn btn-primary" href="/search">
                Search Locks
              </Link>
              {connected ? (
                <Link className="btn btn-secondary" href="/dashboard">
                  Your Dashboard
                </Link>
              ) : (
                <WalletMultiButton />
              )}
            </div>
          </div>

          <Image
            className="hidden md:block mx-auto my-4"
            width={400}
            height={400}
            src="/hero.png"
            alt="Valhalla Hero"
          />
        </div>
      </div>

      <SocialBar />
    </div>
  );
}
