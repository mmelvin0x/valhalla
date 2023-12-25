import Image from "next/image";

export default function SecurityAndTrustSection() {
  return (
    <div className="security-trust py-10">
      <div className="container mx-auto text-center">
        <h2 className="degen-locker mb-6">Security and Trust</h2>

        <div className="grid md:grid-cols-2 items-center gap-10">
          {/* Security Feature */}
          <div className="flex flex-col items-center">
            <div className="mb-10">
              <Image
                src="/security.png"
                alt="Security"
                width={250}
                height={250}
              />
            </div>
            <h3 className="degen-locker mb-2">Advanced Security</h3>
            <p className="prose">
              Leveraging state-of-the-art encryption and audited smart
              contracts, we ensure the highest level of security for your
              assets.
            </p>
          </div>

          {/* Trust Feature */}
          <div className="flex flex-col items-center">
            <div className="mb-4">
              <Image src="/trust.png" alt="Trust" width={250} height={250} />
            </div>
            <h3 className="degen-locker mb-2">Built on Trust</h3>
            <p className="prose">
              Our transparent operations and partnerships with leading DEXs
              establish a foundation of trust and reliability.
            </p>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center">
          <p className="text-lg prose">
            Experience a DeFi platform where security meets innovation. Join
            Valhalla and be part of a trusted community.
          </p>
        </div>
      </div>
    </div>
  );
}
