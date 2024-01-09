import type { NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import SocialBar from "components/SocialBar";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

const Home: NextPage = () => {
  const { connected } = useWallet();
  return (
    <div>
      <Head>
        <title>Valhalla - Token Vesting and Locks</title>
        <meta
          name="description"
          content="Secure and Simplify Your Liquidity Management with Valhalla"
        />
      </Head>

      <div className="hero py-10 hero-gradient -mt-3">
        <div className="mx-auto">
          <div className="grid grid-cols-1 gap-8 p-6 md:grid-cols-2">
            <div className="flex flex-col items-center justify-center gap-2">
              <h1 className=" text-center">Lock 'til Valhalla</h1>
              <p className="prose text-white">
                Gain the chain's trust by locking your LP tokens
              </p>

              <p className="text-xl mb-2">
                Secure and Simplify Your Token Management with Valhalla
              </p>
              <div className="card-actions">
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

            <Image
              className="mx-auto"
              width={350}
              height={350}
              src="/logo512.png"
              alt="Valhalla Hero"
            />
          </div>
        </div>
      </div>

      <div className="p-10">
        <div className="text-center">
          <h2 className=" mb-6">Liquidity Locking with Valhalla</h2>
          <p className="mb-6 prose mx-auto text-center">
            Elevate your DeFi experience with Valhalla, the premier destination
            for efficient and secure liquidity locking. Simplify your liquidity
            management and gain the community's trust.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-4">
          <div className="card">
            <div className="card-body">
              <h3 className="card-title ">Advanced Liquidity Locking</h3>
              <p className="prose">
                Experience the pinnacle of liquidity management. Valhalla
                provides an intuitive, secure, and hassle-free way to lock your
                LP tokens, giving you peace of mind and optimal financial
                benefits.
              </p>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <h3 className="card-title ">Robust and Simple APIs</h3>
              <p className="prose">
                Valhalla's APIs are designed to be simple and easy to use. We
                provide a variety of endpoints to help you and our partners
                verify if a project has locked their liquidity.
              </p>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <h3 className="card-title ">Exclusive Locking Rewards</h3>
              <p className="prose">
                Benefit from locking your liquidity. Valhalla offers unique
                incentives and rewards for locking your liquidity. Our points
                system provides us the flexibility to reward our users in a
                variety of ways.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center">
          <SocialBar />

          <p className="prose mx-auto text-center">
            Follow our socials for the latest announcements about rewards and
            new features.
          </p>
        </div>

        <div className="text-center mt-10">
          <Link href="/locks/create" className="btn btn-primary">
            Start Liquidity Locking with Valhalla
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Home;
