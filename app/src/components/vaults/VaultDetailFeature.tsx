import { useEffect, useState } from "react";

import Head from "next/head";
import LoadingSpinner from "components/ui/LoadingSpinner";
import { ValhallaVault } from "models/models";
import { getVaultByIdentifier } from "utils/search";
import { shortenAddress } from "utils/formatters";
import useProgram from "program/useProgram";
import { useRouter } from "next/router";

export default function VaultDetailFeature() {
  const { connection } = useProgram();
  const router = useRouter();
  const [vault, setVault] = useState<ValhallaVault | null>(null);

  const getVault = async () => {
    if (router.query.identifier) {
      const vault = await getVaultByIdentifier(
        connection,
        router.query.identifier as string,
      );

      await vault.populate(connection, vault);

      console.log(
        "%c🤪 ~ file: VaultDetailFeature.tsx:21 [VaultDetailFeature/getVault/vault] -> vault : ",
        "color: #3b0524",
        vault,
      );

      setVault(vault);
    }
  };

  useEffect(() => {
    getVault();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="m-8">
      <Head>
        <title>Valhalla | Token Vesting Solutions</title>
        <meta
          name="description"
          content="Token Vesting and Locks on Solana. Lock your tokens until Valhalla."
        />
      </Head>

      <main className="grid grid-cols-1 gap-8">
        <section className="card">
          <div className="card-body">
            {!!vault ? (
              <>
                <div className="card-title">{shortenAddress(vault.key)}</div>
              </>
            ) : (
              <div className="flex items-center justify-center">
                <LoadingSpinner />
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
