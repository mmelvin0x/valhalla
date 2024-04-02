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
  TransactionInstruction,
  clusterApiUrl,
} from "@solana/web3.js";
import {
  PROGRAM_ID,
  Vault,
  canDisburseVault,
  createDisburseInstruction,
  getCronStringFromVault,
  getMintWithCorrectTokenProgram,
  getPDAs,
  getValhallaConfig,
  getVaultByIdentifier,
  hasStartDatePassed,
  sleep,
  vaultDiscriminator,
} from "@valhalla/lib";
import express, { Request, Response } from "express";

import { ClockworkProvider } from "@clockwork-xyz/sdk";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
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
const provider = new anchor.AnchorProvider(
  connection,
  new NodeWallet(payer),
  anchor.AnchorProvider.defaultOptions()
);

const clockworkProvider = ClockworkProvider.fromAnchorProvider(provider);

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

app.post("/repair", async (_req: Request, res: Response) => {
  const gpaBuilder = Vault.gpaBuilder();
  gpaBuilder.addFilter("autopay", true);
  gpaBuilder.addFilter("accountDiscriminator", vaultDiscriminator);
  const response = await gpaBuilder.run(connection);
  const vaults = response.map(
    (account) => Vault.fromAccountInfo(account.account)[0]
  );

  const count = 0;
  console.log(`Repairing ${vaults.length} vaults...`);

  res.status(200).json({ count });
});

const disburse = async (vault: Vault): Promise<TransactionInstruction> => {
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

  const recipientAta = getAssociatedTokenAddressSync(
    vault.mint,
    vault.recipient,
    false,
    tokenProgramId,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );

  return createDisburseInstruction({
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
    governanceTokenMint: config.governanceTokenMintKey,
    tokenProgram: tokenProgramId,
    governanceTokenProgram: TOKEN_PROGRAM_ID,
    associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
  });
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
  cron.schedule("*/15 * * * *", async () => {
    console.log("Checking for vaults...");
    const vaults = response
      .map((account) => Vault.fromAccountInfo(account.account)[0])
      .map((vault) => {
        scheduledVaults.set(vault.identifier.toString(), false);
        return vault;
      });

    for (let i = 0; i < vaults.length; i++) {
      if (
        !scheduledVaults.get(vaults[i].identifier.toString()) &&
        hasStartDatePassed(Number(vaults[i].startDate))
      ) {
        const threadId = vaults[i].identifier.toString();
        const [thread] = clockworkProvider.getThreadPDA(
          provider.wallet.publicKey,
          threadId
        );

        const trigger = {
          cron: {
            schedule: getCronStringFromVault(Number(vaults[i].payoutInterval)),
            skippable: false,
          },
        };

        try {
          const ix = await clockworkProvider.threadCreate(
            provider.wallet.publicKey,
            threadId,
            [await disburse(vaults[i])],
            trigger
          );

          const tx = new Transaction().add(ix);
          const sig = await clockworkProvider.anchorProvider.sendAndConfirm(tx);

          console.log(`Thread Created: ${sig}`);
          console.log(`Thread ID: ${threadId}`);
          console.log(`Thread PDA: ${thread}`);
          console.log(`Interval: Every ${vaults[i].payoutInterval} seconds`);
          console.log();

          scheduledVaults.set(vaults[i].identifier.toString(), true);
          await sleep(1000);
        } catch (e) {
          if (e.logs?.[3].includes("already in use")) {
            scheduledVaults.set(vaults[i].identifier.toString(), true);
          } else {
            console.error(e);
          }
        }
      }
    }
  });
});
