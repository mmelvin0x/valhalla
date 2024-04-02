import * as anchor from "@coral-xyz/anchor";

import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import {
  Cluster,
  Connection,
  Keypair,
  Transaction,
  clusterApiUrl,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import {
  PROGRAM_ID,
  Vault,
  createDisburseInstruction,
  getCronStringFromVault,
  getMintWithCorrectTokenProgram,
  getPDAs,
  getValhallaConfig,
  hasStartDatePassed,
  sleep,
  vaultDiscriminator,
} from "@valhalla/lib";
import express, { Request, Response } from "express";

import bodyParser from "body-parser";
import cors from "cors";
import cron from "node-cron";
import dotenv from "dotenv";

dotenv.config();

const port = process.env.PORT ? Number(process.env.PORT) : 3001;
const network = (process.env.NETWORK ?? "devnet") as Cluster;

const payer = Keypair.fromSecretKey(
  new Uint8Array(JSON.parse(process.env.PAYER_SECRET_KEY))
);

const connection = new Connection(clusterApiUrl(network), "confirmed");

const app = express();
app.use(cors());
app.use(bodyParser.json());

const scheduledVaults = new Map<string, boolean>();

/**
 * Health check endpoint
 */
app.get("/health", (_req: Request, res: Response) => {
  res.status(200).send("OK");
});

const disburse = async (vault: Vault): Promise<void> => {
  const { config, key } = await getValhallaConfig(connection);
  const { tokenProgramId } = await getMintWithCorrectTokenProgram(
    connection,
    vault
  );
  const { vault: vaultKey, vaultAta } = getPDAs(
    PROGRAM_ID,
    new anchor.BN(vault.identifier),
    vault.creator,
    vault.mint
  );

  const signerGovernanceAta = getAssociatedTokenAddressSync(
    config.governanceTokenMintKey,
    payer.publicKey,
    false,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );

  const creatorGovernanceAta = getAssociatedTokenAddressSync(
    config.governanceTokenMintKey,
    vault.creator,
    false,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );

  const recipientAta = getAssociatedTokenAddressSync(
    vault.mint,
    vault.recipient,
    false,
    tokenProgramId,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );

  const instruction = createDisburseInstruction({
    signer: payer.publicKey,
    creator: vault.creator,
    recipient: vault.recipient,
    devTreasury: config.devTreasury,
    config: key,
    vault: vaultKey,
    vaultAta,
    signerGovernanceAta,
    recipientAta,
    mint: vault.mint,
    creatorGovernanceAta,
    governanceTokenMint: config.governanceTokenMintKey,
    tokenProgram: tokenProgramId,
    governanceTokenProgram: TOKEN_PROGRAM_ID,
    associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
  });

  const transaction = new Transaction().add(instruction);
  const tx = await sendAndConfirmTransaction(connection, transaction, [payer]);

  if (tx.length === 0) {
    console.error(`Error disbursing vault ${vault.identifier.toString()}`);
    return;
  }

  console.info(
    `Disbursed vault ${vault.identifier.toString()} with interval ${vault.payoutInterval.toString()} seconds - ${new Date().toLocaleString()} - Tx: ${tx}`
  );
};

app.listen(port, async () => {
  console.log(`Server listening on PORT: ${port}`);
  console.log(`Network: ${network}`);
  console.log(`Payer: ${payer.publicKey.toBase58()}`);
  console.log(`Program ID: ${PROGRAM_ID.toBase58()}`);

  const gpaBuilder = Vault.gpaBuilder();
  gpaBuilder.addFilter("autopay", true);
  gpaBuilder.addFilter("accountDiscriminator", vaultDiscriminator);
  const response = await gpaBuilder.run(connection);

  // Checks for new vaults every 15 minutes
  cron.schedule(
    "*/15 * * * *",
    async () => {
      console.log("Checking for vaults...");
      const vaults = response
        .map((account) => Vault.fromAccountInfo(account.account)[0])
        .map((vault) => {
          scheduledVaults.set(vault.identifier.toString(), false);
          return vault;
        });

      for (let i = 0; i < vaults.length; i++) {
        if (scheduledVaults.get(vaults[i].identifier.toString())) {
          continue;
        }

        if (!hasStartDatePassed(Number(vaults[i].startDate))) {
          console.log(
            `Vault ${vaults[i].identifier} has not started yet. Skipping...`
          );

          continue;
        }

        if (
          cron.validate(
            getCronStringFromVault(Number(vaults[i].payoutInterval))
          )
        ) {
          try {
            cron.schedule(
              getCronStringFromVault(Number(vaults[i].payoutInterval)),
              async () => {
                await disburse(vaults[i]);
              },
              {
                recoverMissedExecutions: true,
                runOnInit: true,
              }
            );

            scheduledVaults.set(vaults[i].identifier.toString(), true);
            await sleep(5000);
          } catch (e) {
            if (e.logs?.[3].includes("already in use")) {
              scheduledVaults.set(vaults[i].identifier.toString(), true);
            } else {
              console.error(e);
            }
          }
        } else {
          console.error(
            `Invalid cron string for vault ${vaults[
              i
            ].identifier.toString()}: ${getCronStringFromVault(
              Number(vaults[i].payoutInterval)
            )}`
          );
        }
      }
    },
    { runOnInit: true }
  );
});
