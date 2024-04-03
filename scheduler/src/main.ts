import {
  PROGRAM_ID,
  Vault,
  hasStartDatePassed,
  sleep,
  vaultDiscriminator,
} from "@valhalla/lib";
import { connection, cronSchedule, network, payer, port } from "./network";
import express, { Request, Response } from "express";

import bodyParser from "body-parser";
import { checkEmptyVault } from "./checkEmptyVault";
import cors from "cors";
import cron from "node-cron";
import dotenv from "dotenv";
import { scheduleAutoPay } from "./scheduleAutopay";

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
            await scheduleAutoPay(vaults[i], scheduledVaults);
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
