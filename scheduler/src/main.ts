import {
  PROGRAM_ID,
  Vault,
  getVaultByIdentifier,
  hasStartDatePassed,
  sleep,
  vaultDiscriminator,
} from "@valhalla/lib";
import {
  clockworkProvider,
  connection,
  cronSchedule,
  network,
  payer,
  port,
  provider,
} from "./network";
import express, { Request, Response } from "express";

import { Transaction } from "@solana/web3.js";
import bodyParser from "body-parser";
import { checkEmptyVault } from "./checkEmptyVault";
import cors from "cors";
import cron from "node-cron";
import dotenv from "dotenv";
import { scheduleAutopay } from "./scheduleAutopay";

dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

const scheduledVaults = new Map<string, string>();

/**
 * Health check endpoint
 */
app.get("/health", (_req: Request, res: Response) => {
  res.status(200).send("OK");
});

app.post("/threads", async (req: Request, res: Response) => {
  try {
    const identifier = req.body.identifier;
    if (!identifier) {
      return res.status(400).send("Missing identifier");
    }

    const vault = await getVaultByIdentifier(connection, identifier);
    if (!vault) {
      return res.status(404).send("Vault not found");
    }

    const isEmpty = await checkEmptyVault(vault);
    if (!isEmpty) {
      const thread = await scheduleAutopay(vault);
      if (!thread) {
        return res.status(500).send("Error creating thread");
      }

      return res.status(201).json({ thread, vault: vault.pretty() });
    }
  } catch (e) {
    console.log("Error creating thread: ", e);
    res.status(500).send("Internal server error");
  }
});

app.delete("/threads/:identifier", async (req: Request, res: Response) => {
  const identifier = req.params.identifier;
  const threadId = scheduledVaults.get(identifier);
  const [thread] = clockworkProvider.getThreadPDA(
    provider.wallet.publicKey,
    threadId
  );

  if (!thread) {
    return res.status(404).send("Thread not found");
  }

  const threadCloseIx = await clockworkProvider.threadDelete(
    provider.wallet.publicKey,
    thread,
    provider.wallet.publicKey
  );

  const tx = new Transaction().add(threadCloseIx);
  const sig = await clockworkProvider.anchorProvider.sendAndConfirm(tx);
  scheduledVaults.delete(identifier);
  console.log(
    `Vault ${identifier} autopay disbursement thread created: ${sig}`
  );

  res.status(200).send("OK");
});

app.listen(port, async () => {
  console.log(`Server listening on PORT: ${port}`);
  console.log(`Network: ${network}`);
  console.log(`Payer: ${payer.publicKey.toBase58()}`);
  console.log(`Program ID: ${PROGRAM_ID.toBase58()}`);

  // Checks for new vaults every 15 minutes
  const mainThread = cron.schedule(
    cronSchedule,
    async () => {
      try {
        const gpaBuilder = Vault.gpaBuilder();
        gpaBuilder.addFilter("autopay", true);
        gpaBuilder.addFilter("accountDiscriminator", vaultDiscriminator);
        const vaults = (await gpaBuilder.run(connection))
          .map((account) => Vault.fromAccountInfo(account.account)[0])
          .filter((it) => !scheduledVaults.has(it.identifier.toString()))
          .filter((it) => hasStartDatePassed(Number(it.startDate)));

        console.log("Found vaults: ", vaults.length);

        for (let i = 0; i < vaults.length; i++) {
          const isEmpty = await checkEmptyVault(vaults[i]);
          if (!isEmpty) {
            const { thread, threadId } = await scheduleAutopay(vaults[i]);
            if (!thread || !threadId) {
              console.log("Error creating thread");
            } else {
              scheduledVaults.set(vaults[i].identifier.toString(), threadId);
            }
          }

          await sleep(5000);
        }
      } catch (e) {
        console.log("Error in main thread: ", e);
      }
    },
    { runOnInit: true }
  );

  mainThread.start();
});
