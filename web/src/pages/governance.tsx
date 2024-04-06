import * as anchor from "@coral-xyz/anchor";

import {
  Config,
  PROGRAM_ID,
  ValhallaConfig,
  getMintWithCorrectTokenProgram,
  getPDAs,
} from "@valhalla/lib";
import { useEffect, useState } from "react";

import Head from "next/head";
import { IconArrowRight } from "@tabler/icons-react";
import Image from "next/image";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import Link from "next/link";
import { getExplorerUrl } from "../utils/explorer";
import useProgram from "../hooks/useProgram";
import { useValhallaStore } from "../stores/useValhallaStore";

export default function GovernanceFeature() {
  const { connection } = useProgram();
  const { config, setConfig } = useValhallaStore();

  const [decimals, setDecimals] = useState<number>(1);

  useEffect(() => {
    (async () => {
      const { config: configKey } = getPDAs(PROGRAM_ID);
      const config = await Config.fromAccountAddress(connection, configKey);
      const { mint } = await getMintWithCorrectTokenProgram(connection, {
        mint: config.governanceTokenMintKey,
      });

      setDecimals(mint.decimals);

      setConfig(
        new ValhallaConfig(
          config.admin,
          config.devTreasury,
          config.daoTreasury,
          config.governanceTokenMintKey,
          new anchor.BN(config.devFee),
          new anchor.BN(config.autopayMultiplier),
          new anchor.BN(config.tokenFeeBasisPoints),
          new anchor.BN(config.governanceTokenAmount)
        )
      );
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!config)
    return (
      <div className="m-8 mt-0">
        <Head>
          <title>Valhalla | Token Vesting Solutions</title>
          <meta
            name="description"
            content="Token Vesting and Locks on Solana. Lock your tokens until Valhalla."
          />
        </Head>
      </div>
    );

  return (
    <div className="m-8 mt-0">
      <Head>
        <title>Valhalla | Token Vesting Solutions</title>
        <meta
          name="description"
          content="Token Vesting and Locks on Solana. Lock your tokens until Valhalla."
        />
      </Head>

      <main className="grid grid-cols-1 gap-8 my-8">
        <section className="card">
          <div className="card-body">
            <h1 className="text-4xl font-bold text-center mb-4">Governance</h1>

            {/* Governance */}
            <section className="mb-8">
              <h2 className="text-3xl font-bold mb-4">
                Valhalla.so Governance
              </h2>
              <p>
                A Solana-based decentralized application (dApp) designed for
                token vesting, compatible with the Token 2022 & SPL standards,
                and governed by a Decentralized Autonomous Organization (DAO)
                through the{" "}
                <Link
                  className="link link-primary"
                  href={getExplorerUrl(
                    connection.rpcEndpoint,
                    config?.governanceTokenMintKey
                  )}
                >
                  $ODIN
                </Link>{" "}
                token. Users can engage with various services, earning{" "}
                <Link
                  className="link link-primary"
                  href={getExplorerUrl(
                    connection.rpcEndpoint,
                    config?.governanceTokenMintKey
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
                        config.governanceTokenMintKey
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
                      config?.governanceTokenMintKey
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
                      config.governanceTokenMintKey
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
                    config.governanceTokenMintKey
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
                        Dev Team -{" "}
                        {(
                          config.devFee.toNumber() / LAMPORTS_PER_SOL
                        ).toLocaleString()}{" "}
                        SOL{" "}
                        <span className="text-xs">
                          (starting minimum, can be increased by vote)
                        </span>
                      </li>
                      <li>
                        DAO Treasury -{" "}
                        {(
                          (100 * config.tokenFeeBasisPoints.toNumber()) /
                          10_000
                        ).toLocaleString()}
                        % of the vested amount{" "}
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
                  <hr />
                  <div className="timeline-start font-bold">Create a Vault</div>
                  <div className="timeline-middle">
                    <IconArrowRight />
                  </div>
                  <div className="timeline-end timeline-box">
                    {(
                      Number(config?.governanceTokenAmount) /
                      10 ** decimals
                    ).toLocaleString()}{" "}
                    <Link
                      className="link link-primary"
                      href={getExplorerUrl(
                        connection.rpcEndpoint,
                        config.governanceTokenMintKey
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
                    {(
                      Number(config.governanceTokenAmount) /
                      10 ** decimals
                    ).toLocaleString()}{" "}
                    <Link
                      className="link link-primary"
                      href={getExplorerUrl(
                        connection.rpcEndpoint,
                        config.governanceTokenMintKey
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
