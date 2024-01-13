import type { NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import SocialBar from "components/SocialBar";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useEffect } from "react";
import { useRouter } from "next/router";

const Home: NextPage = () => {
  const { connected } = useWallet();
  const router = useRouter();

  useEffect(() => {
    if (connected) {
      router.push("/dashboard");
    }
  }, [connected]);

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
          <div className="flex flex-col items-center justify-center gap-2 text-center">
            <h1>Valhalla</h1>

            <p className="text-xl font-bold mb-2">Token Vesting Solutions</p>
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
};

export default Home;
