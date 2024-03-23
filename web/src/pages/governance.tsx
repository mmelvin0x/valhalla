import Head from "next/head";
import { IconArrowRight } from "@tabler/icons-react";
import Image from "next/image";
import Link from "next/link";
import { ValhallaConfig } from "@valhalla/lib";
import { getExplorerUrl } from "../utils/explorer";
import { useEffect } from "react";
import useProgram from "../contexts/useProgram";
import { useValhallaStore } from "../stores/useValhallaStore";

export default function GovernanceFeature() {
  const { connection, program } = useProgram();
  const { config, setConfig } = useValhallaStore();

  useEffect(() => {
    (async () => {
      const config = (await program.account.config.all())[0];
      setConfig(
        new ValhallaConfig(
          (config.account as any).admin,
          (config.account as any).devTreasury,
          (config.account as any).daoTreasury,
          (config.account as any).governanceTokenMintKey,
          (config.account as any).devFee,
          (config.account as any).autopayMultiplier,
          (config.account as any).tokenFeeBasisPoints,
          (config.account as any).governanceTokenAmount
        )
      );
    })();
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
            <h1 className="text-4xl font-bold text-center mb-4">Governance</h1>
            <div className="text-center mb-8">
              <Image
                src="/hero.webp"
                alt="Valhalla.so Overview"
                width={1024}
                height={1024}
                priority
              />
            </div>

            {/* Governance */}
            <section className="mb-8">
              <h2 className="text-3xl font-bold mb-4">
                Valhalla.so Governance
              </h2>
              <p>
                A Solana-based decentralized application (dApp) designed for
                token vesting, compatible with the token 2022 standard, and
                governed by a Decentralized Autonomous Organization (DAO)
                through the{" "}
                <Link
                  className="link link-primary"
                  href={getExplorerUrl(
                    connection.rpcEndpoint,
                    config?.governanceTokenMintKey!
                  )}
                >
                  $ODIN
                </Link>{" "}
                token. Users can engage with various services, earning{" "}
                <Link
                  className="link link-primary"
                  href={getExplorerUrl(
                    connection.rpcEndpoint,
                    config?.governanceTokenMintKey!
                  )}
                >
                  $ODIN
                </Link>{" "}
                tokens and participating in the governance of the platform, and
                are controlled and managed by the DAO.
              </p>
              <Link
                href="/docs"
                className="link link-primary"
                target="_blank"
                rel="noopener noreferrer"
              >
                Learn more in the Docs
              </Link>
            </section>

            {/* Features */}
            <section className="mb-8">
              <h2 className="text-3xl font-bold mb-4">Features</h2>
              <ul className="list-disc pl-5">
                <li>
                  <strong>
                    <Link
                      className="link link-primary"
                      href={getExplorerUrl(
                        connection.rpcEndpoint,
                        config?.governanceTokenMintKey!
                      )}
                    >
                      $ODIN
                    </Link>{" "}
                    Token:
                  </strong>{" "}
                  Governance token for DAO participation and voting.
                </li>
                <li>
                  <strong>Fees:</strong> Includes a flat SOL fee, an optional
                  autopay SOL fee, and a token fee on vested tokens. The fees
                  are distributed to the development team and DAO treasury. DAO
                  members can vote to adjust the fees, and to control the
                  treasury.
                </li>
                <li>
                  <strong>Autopay and PvP:</strong> Competitive mechanism for
                  disbursing vaults and earning{" "}
                  <Link
                    className="link link-primary"
                    href={getExplorerUrl(
                      connection.rpcEndpoint,
                      config?.governanceTokenMintKey!
                    )}
                  >
                    $ODIN
                  </Link>
                  .
                </li>
                <li>
                  <strong>Configurable Elements:</strong> Users vote on key dApp
                  settings using{" "}
                  <Link
                    className="link link-primary"
                    href={getExplorerUrl(
                      connection.rpcEndpoint,
                      config?.governanceTokenMintKey!
                    )}
                  >
                    $ODIN
                  </Link>{" "}
                  tokens.
                </li>
              </ul>
            </section>

            {/* Configurable Elements */}
            <section className="mb-8">
              <h2 className="text-3xl font-bold mb-4">Configurable Elements</h2>
              <p>
                Through{" "}
                <Link
                  className="link link-primary"
                  href={getExplorerUrl(
                    connection.rpcEndpoint,
                    config?.governanceTokenMintKey!
                  )}
                >
                  $ODIN
                </Link>{" "}
                tokens, users have the power to vote on significant changes
                within the platform, including fee adjustments, treasury
                management, and other crucial configurations that determine the
                operation and future direction of Valhalla.so.
              </p>
            </section>

            {/* Fees */}
            <section className="mb-8">
              <h2 className="text-3xl font-bold mb-4">Fees</h2>
              <p>
                The dApp charges a flat fee in SOL, an additional autopay fee in
                SOL for those who opt-in, and a token fee based on the
                percentage of the tokens being vested. These fees contribute to
                the development and sustainability of the platform.
              </p>

              <ul className="mt-8 timeline timeline-vertical">
                <li>
                  <div className="timeline-start font-bold">Create a Vault</div>
                  <div className="timeline-middle">
                    <IconArrowRight />
                  </div>
                  <div className="timeline-end timeline-box">
                    <ul>
                      <li>
                        Dev Team - {config?.devFee} SOL{" "}
                        <span className="text-xs">
                          (starting minimum, can be increased by vote)
                        </span>
                      </li>
                      <li>
                        DAO Treasury - {config?.tokenFeeBasisPoints!} of the
                        vested amount{" "}
                        <span className="text-xs">(adjustable by vote)</span>
                      </li>
                    </ul>
                  </div>
                  <hr />
                </li>
              </ul>
            </section>

            {/* Token Distribution */}
            <section className="mb-8">
              <h2 className="text-3xl font-bold mb-4">Token Distribution</h2>
              <ul className="timeline timeline-vertical">
                <li>
                  <div className="timeline-start font-bold">
                    Initial Distribution
                  </div>
                  <div className="timeline-middle">
                    <IconArrowRight />
                  </div>
                  <div className="timeline-end timeline-box">
                    <ul>
                      <li>
                        Liquidity - 9,000,000{" "}
                        <Link
                          className="link link-primary"
                          href={getExplorerUrl(
                            connection.rpcEndpoint,
                            config?.governanceTokenMintKey!
                          )}
                        >
                          $ODIN
                        </Link>
                      </li>
                      <li>
                        Bootstrap the DAO - 1,000,000{" "}
                        <Link
                          className="link link-primary"
                          href={getExplorerUrl(
                            connection.rpcEndpoint,
                            config?.governanceTokenMintKey!
                          )}
                        >
                          $ODIN
                        </Link>
                      </li>
                    </ul>
                  </div>
                  <hr />
                </li>

                <li>
                  <hr />
                  <div className="timeline-start font-bold">Create a Vault</div>
                  <div className="timeline-middle">
                    <IconArrowRight />
                  </div>
                  <div className="timeline-end timeline-box">
                    {config?.governanceTokenAmount}{" "}
                    <Link
                      className="link link-primary"
                      href={getExplorerUrl(
                        connection.rpcEndpoint,
                        config?.governanceTokenMintKey!
                      )}
                    >
                      $ODIN
                    </Link>{" "}
                    <span className="text-xs">(adjustable by vote)</span>
                  </div>
                  <hr />
                </li>

                <li>
                  <hr />
                  <div className="timeline-start font-bold">
                    Disburse a Vault
                  </div>
                  <div className="timeline-middle">
                    <IconArrowRight />
                  </div>
                  <div className="timeline-end timeline-box">
                    {config?.governanceTokenAmount}{" "}
                    <Link
                      className="link link-primary"
                      href={getExplorerUrl(
                        connection.rpcEndpoint,
                        config?.governanceTokenMintKey!
                      )}
                    >
                      $ODIN
                    </Link>{" "}
                    <span className="text-xs">(adjustable by vote)</span>
                  </div>
                  <hr />
                </li>
              </ul>
            </section>

            {/* more */}
            <footer className="text-center py-8">
              <p>
                Discover more about blockchain and DeFi by visiting{" "}
                <Link
                  href="https://medium.com/valhalla_so"
                  className="link link-primary"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  our blog
                </Link>
                .
              </p>
            </footer>
          </div>
        </section>
      </main>
    </div>
  );
}
