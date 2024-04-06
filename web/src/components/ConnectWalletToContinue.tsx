import Head from "next/head";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

export default function ConnectWalletToContinue() {
  return (
    <div className="m-8">
      <Head>
        <title>Valhalla | Token Vesting Solutions</title>
        <meta
          name="description"
          content="Token Vesting and Locks on Solana. Lock your tokens until Valhalla."
        />
      </Head>

      <div className="card">
        <div className="card-body">
          <figure className="rounded-lg">
            <div className="card">
              <div className="card-body items-center">
                <h1 className="text-2xl font-bold">Connect your wallet</h1>
                <p className="prose">
                  To continue, you will need to connect your wallet.
                </p>
                <WalletMultiButton />
              </div>
            </div>
          </figure>
        </div>
      </div>
    </div>
  );
}
