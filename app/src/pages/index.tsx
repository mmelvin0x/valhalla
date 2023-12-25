import type { NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import { FaDiscord, FaMedium, FaTelegram, FaTwitter } from "react-icons/fa";
import CTABar from "components/home/CTABar";
import HeroSection from "components/home/HeroSection";
import WhyUsSection from "components/home/WhyUsSection";
import HowItWorksSection from "components/home/HowItWorksSection";
import SecurityAndTrustSection from "components/home/SecurityAndTrustSection";
import SocialBar from "components/SocialBar";

const Home: NextPage = () => {
  return (
    <div>
      <Head>
        <title>Valhalla - Liquidity Locking</title>
        <meta
          name="description"
          content="Secure and Simplify Your Liquidity Management with Valhalla"
        />
      </Head>

      <CTABar />
      <HeroSection />

      <div className="p-10 bg-base-100">
        <div className="text-center">
          <h2 className="degen-locker mb-6">Liquidity Locking with Valhalla</h2>
          <p className="mb-6 prose mx-auto text-center">
            Elevate your DeFi experience with Valhalla, the premier destination
            for efficient and secure liquidity locking. Simplify your liquidity
            management and gain the community's trust.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-4">
          <div className="card shadow-xl">
            <div className="card-body">
              <h3 className="card-title degen-locker">
                Advanced Liquidity Locking
              </h3>
              <p className="prose">
                Experience the pinnacle of liquidity management. Valhalla
                provides an intuitive, secure, and hassle-free way to lock your
                LP tokens, giving you peace of mind and optimal financial
                benefits.
              </p>
            </div>
          </div>

          <div className="card shadow-xl">
            <div className="card-body">
              <h3 className="card-title degen-locker">
                Real-Time Locking Dashboard
              </h3>
              <p className="prose">
                Stay informed with our state-of-the-art dashboard. Track your
                locked liquidity in real-time, understand market trends, and
                make informed decisions for maximum returns.
              </p>
            </div>
          </div>

          <div className="card shadow-xl">
            <div className="card-body">
              <h3 className="card-title degen-locker">
                Exclusive Locking Rewards
              </h3>
              <p className="prose">
                Benefit from locking your liquidity with us. Valhalla offers
                unique incentives and rewards for locking your liquidity. Our
                points system provides us the flexibility to reward our users in
                a variety of ways.
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
