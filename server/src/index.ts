import express, {
  type Application,
  type NextFunction,
  type Request,
  type Response,
} from "express";
import dotenv from "dotenv";
import {
  type Cluster,
  Connection,
  Keypair,
  clusterApiUrl,
} from "@solana/web3.js";
import wallet from "../.keys/id.json";
import cron from "node-cron";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import { registerVaults } from "./registerVault";
import { scheduleRegisteredVaults } from "./scheduleVault";
import WinstonLogger from "./logger";

dotenv.config();

const logger = WinstonLogger.logger();

const EVERY_HOUR = "0 * * * *";
const EVERY_FIVE_MINUTES = "*/5 * * * *";
const EVERY_MINUTE = "* * * * *";
const REGISTERED_IDS = new Set<number>();
const SCHEDULED_IDS = new Set<number>();

const app: Application = express();
const port = process.env.PORT ?? 3001;

const payer = new NodeWallet(Keypair.fromSecretKey(new Uint8Array(wallet)));
const connection = new Connection(
  clusterApiUrl((process.env.CLUSTER as Cluster) ?? "devnet"),
);

app.use("/healthcheck", (req: Request, res: Response, next: NextFunction) => {
  res.status(200).send({ data: "Healthy!" });
});

// eslint-disable-next-line @typescript-eslint/no-misused-promises
app.listen(port, () => {
  logger.info(`Server is listening on port ${port}!`);
  logger.info(`Cluster: ${process.env.CLUSTER != null || "devnet"}`);
  logger.info(`Payer: ${payer.publicKey.toBase58()}`);

  cron.schedule(
    EVERY_FIVE_MINUTES,
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    async () => {
      logger.info("Scheduling registered vaults");
      const ids = await scheduleRegisteredVaults(
        connection,
        payer,
        SCHEDULED_IDS,
      );
      logger.info(`Scheduled ${ids.length} vaults`);
      ids.forEach((id) => SCHEDULED_IDS.add(id));
    },
  );

  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  cron.schedule(EVERY_MINUTE, async () => {
    logger.info("Registering vaults");
    const ids = await registerVaults(connection, payer, REGISTERED_IDS);
    logger.info(`Registered ${ids.size} vaults`);
    ids.forEach((id) => REGISTERED_IDS.add(id));
  });
});
