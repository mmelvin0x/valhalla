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
  ValhallaVault,
  canDisburseVault,
  createDisburseInstruction,
  getMintWithCorrectTokenProgram,
  getPDAs,
  getValhallaConfig,
  getVaultByIdentifier,
  secondsToCronString,
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

app.post("/schedule", async (req: Request, res: Response) => {
  console.log(req.body);
  const { identifier } = req.body;
  const vault = await getVaultByIdentifier(connection, identifier);

  if (!vault) {
    return res.status(404).json({ error: "Vault not found!" });
  }

  if (!vault.autopay) {
    return res.status(400).json({ error: "Vault is not autopay!" });
  }

  console.log(
    `Scheduling vault ${vault.identifier} for disbursement on an interval of ${vault.payoutInterval}.`
  );
  const interval = secondsToCronString(vault._payoutInterval);
  cron.schedule(interval, async (): Promise<void> => {
    await disburse(vault);
    console.log(
      `Disbursed vault ${vault.identifier} at ${new Date().toLocaleString()}`
    );
  });

  return res.status(200).json({ message: `Scheduled vault for autopay!` });
});

const disburse = async (vault: ValhallaVault) => {
  if (!canDisburseVault(vault)) {
    console.log(`Vault ${vault.identifier} is locked!`);
  }

  const { config, key } = await getValhallaConfig(connection);
  const { tokenProgramId } = await getMintWithCorrectTokenProgram(
    connection,
    vault
  );
  const { vault: vaultKey, vaultAta } = getPDAs(
    PROGRAM_ID,
    vault.identifier,
    vault.creator,
    vault.mint
  );

  const signerGovernanceAta = getAssociatedTokenAddressSync(
    vault.mint,
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
    console.error(`Error disbursing vault ${vault.identifier.toString()}\n`);
    return;
  }

  console.info(
    `Disbursed vault ${vault.identifier.toString()} at ${new Date().toLocaleString()}. Tx: ${tx}\n`
  );
};

app.listen(port, () => {
  console.log(`Server listening on PORT: ${port}`);
  console.log(`Network: ${network}`);
  console.log(`Payer: ${payer.publicKey.toBase58()}`);
  console.log(`Program ID: ${PROGRAM_ID.toBase58()}`);
});
