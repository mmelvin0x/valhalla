import { cronSchedule, network, payer, port } from "./network";
import express, { Request, Response } from "express";

import { PROGRAM_ID } from "@valhalla/lib";
import bodyParser from "body-parser";
import { checkVaults } from "./checkVaults";
import cors from "cors";
import cron from "node-cron";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

let scheduledVaults = new Map<string, boolean>();

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
  cron
    .schedule(
      cronSchedule,
      async () => {
        scheduledVaults = await checkVaults(scheduledVaults);
      },
      { runOnInit: true }
    )
    .start();
});
