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
import { createTasks } from "./createTasks";
import WinstonLogger from "./logger";
import { getVaultsToSchedule } from "./getVaultsToSchedule";

dotenv.config();

const logger = WinstonLogger.logger();

const SCHEDULE_INTERVAL = process.env.SCHEDULE_INTERVAL ?? "* * * * *";
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

app.listen(port, () => {
  logger.info(`Server is listening on port ${port}!`);
  logger.info(`Cluster: ${process.env.CLUSTER != null || "devnet"}`);
  logger.info(`Payer: ${payer.publicKey.toBase58()}`);

  cron.schedule(SCHEDULE_INTERVAL, () => {
    void scheduler();
  });
});

const scheduler = async (): Promise<void> => {
  const logger = WinstonLogger.logger();
  const vaultsToSchedule = (await getVaultsToSchedule(connection)).filter(
    (it) => !SCHEDULED_IDS.has(Number(it.identifier)),
  );

  logger.info(`\nFound ${vaultsToSchedule.length} unscheduled vaults.\n`);

  const vaultTasks = createTasks(connection, payer, vaultsToSchedule);
  vaultTasks.forEach((vaultTask) => {
    vaultTask.task.start();
    SCHEDULED_IDS.add(Number(vaultTask.vault.identifier));
    logger.info(`Scheduled vault: ${Number(vaultTask.vault.identifier)}`);
  });
};
