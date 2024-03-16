import Head from "next/head";
import useProgram from "program/useProgram";

export default function GovernanceFeature() {
  const { wallet, connection } = useProgram();

  return (
    <div className="m-8">
      <Head>
        <title>Valhalla | Token Vesting Solutions</title>
        <meta
          name="description"
          content="Token Vesting and Locks on Solana. Lock your tokens until Valhalla."
        />
      </Head>

      <main className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section className="card">
          <div className="card-body">
            <div className="card-title">Governance</div>
          </div>
        </section>
      </main>
    </div>
  );
}
