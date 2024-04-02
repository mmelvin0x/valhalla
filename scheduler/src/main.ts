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
  canDisburseVault,
  createDisburseInstruction,
  getMintWithCorrectTokenProgram,
  getPDAs,
  getValhallaConfig,
  secondsToCronString,
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

const connection = new Connection(clusterApiUrl(network), "confirmed");
const payer = Keypair.fromSecretKey(
  new Uint8Array(JSON.parse(process.env.PAYER_SECRET_KEY))
);

const app = express();
app.use(cors());
app.use(bodyParser.json());

const scheduledVaults = new Map<string, cron.ScheduledTask>();

/**
 * Health check endpoint
 */
app.get("/health", (_req: Request, res: Response) => {
  res.status(200).send("OK");
});

/**
 * Unschedule a vault
 * @param identifier - The vault identifier
 */
app.delete("/schedule", async (req: Request, res: Response) => {
  const { identifier } = req.body;

  if (!scheduledVaults.has(identifier)) {
    res.status(400).send(`Vault ${identifier} not scheduled`);
    return;
  }

  const task = scheduledVaults.get(identifier);
  task.stop();
  scheduledVaults.delete(identifier);

  res.status(200).send(`Vault ${identifier} unscheduled`);
});

/**
 * Schedule a vault for autopay
 * @param identifier - The vault identifier
 */
app.post("/schedule", async (req: Request, res: Response) => {
  const { identifier } = req.body;

  if (scheduledVaults.has(identifier)) {
    res.status(400).send(`Vault ${identifier} already scheduled`);
    return;
  }

  const gpaBuilder = Vault.gpaBuilder();
  gpaBuilder.addFilter("accountDiscriminator", vaultDiscriminator);
  gpaBuilder.addFilter("identifier", new anchor.BN(identifier));
  const response = await gpaBuilder.run(connection);
  if (response.length === 0) {
    res.status(404).send(`Vault ${identifier} not found`);
    return;
  }

  const [vault] = Vault.fromAccountInfo(response[0].account);
  const interval = secondsToCronString(Number(vault.payoutInterval));
  console.log(
    "%c🤪 ~ file: main.ts:135 [] -> interval : ",
    "color: #810ded",
    interval
  );

  if (!cron.validate(interval)) {
    res.status(400).send(`Invalid interval for vault ${identifier}`);
    return;
  }

  console.log(`Scheduling vault ${identifier}...`);

  try {
    console.log(`Disbursing vault ${vault.identifier}...`);
    await disburse(vault);
    console.log(
      `Disbursed vault ${vault.identifier} at ${new Date().toLocaleString()}`
    );
  } catch (error) {
    console.error(
      `Error disbursing vault ${vault.identifier.toString()}`,
      error
    );
  }

  const task = cron.schedule(
    interval,
    async (): Promise<void> => {
      try {
        await disburse(vault);
      } catch (error) {
        console.error(
          `Error disbursing vault ${vault.identifier.toString()}`,
          error
        );
      }
    },
    { name: vault.identifier.toString(), scheduled: false }
  );

  scheduledVaults.set(vault.identifier.toString(), task);
  task.start();

  return res.status(201).json(vault.pretty());
});

app.post("/repair", async (_req: Request, res: Response) => {
  const gpaBuilder = Vault.gpaBuilder();
  gpaBuilder.addFilter("autopay", true);
  gpaBuilder.addFilter("accountDiscriminator", vaultDiscriminator);
  const response = await gpaBuilder.run(connection);
  const vaults = response.map(
    (account) => Vault.fromAccountInfo(account.account)[0]
  );

  console.log(`Repairing ${vaults.length} vaults...`);

  let count = 0;
  for (const vault of vaults) {
    if (!scheduledVaults.has(vault.identifier.toString())) {
      const interval = secondsToCronString(Number(vault.payoutInterval));
      const task = cron.schedule(
        interval,
        async (): Promise<void> => {
          try {
            await disburse(vault);
          } catch (error) {
            console.error(
              `Error disbursing vault ${vault.identifier.toString()}`,
              error
            );
          }
        },
        { name: vault.identifier.toString(), scheduled: false }
      );

      scheduledVaults.set(vault.identifier.toString(), task);
      task.start();
      count++;

      console.log(`Scheduled vault ${vault.identifier}...`);
      await sleep(1000);
    }
  }

  res.status(200).json({ count });
});

const disburse = async (vault: Vault) => {
  const canDisburse = await canDisburseVault(connection, vault);
  if (!canDisburse) {
    console.log(
      `Vault ${
        vault.identifier
      } is locked or empty! - ${new Date().toLocaleString()}`
    );

    return;
  }

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
    `Disbursed vault ${vault.identifier.toString()} at ${new Date().toLocaleString()}. Tx: ${tx}`
  );
};

app.listen(port, () => {
  console.log(`Server listening on PORT: ${port}`);
  console.log(`Network: ${network}`);
  console.log(`Payer: ${payer.publicKey.toBase58()}`);
  console.log(`Program ID: ${PROGRAM_ID.toBase58()}`);
});
