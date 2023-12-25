import Image from "next/image";

export default function WhyUsSection() {
  return (
    <div className="about-us py-10">
      <div className="container mx-auto">
        <h2 className="degen-locker mb-6">About Valhalla</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
          <div>
            <p className="mb-4 prose">
              Valhalla is at the forefront of DeFi innovation on the Solana
              blockchain, offering a secure platform for liquidity providers.
              Locking LP tokens not only enhances investment security but also
              boosts trust within your community.
            </p>
            <p className="mb-4 prose">
              Partnering with leading DEXs, we ensure your tokens are recognized
              and trusted across the network. Join Valhalla for a secure,
              rewarding DeFi experience.
            </p>
          </div>

          <div className="mx-auto">
            <Image src="/about.png" width={400} height={400} alt="About Us" />
          </div>
        </div>
      </div>
    </div>
  );
}
