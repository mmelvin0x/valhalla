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
import cron, { type ScheduledTask } from "node-cron";
import { Vault, vaultDiscriminator } from "./program/vault";
import { cronToTimeStringWithSteps, cronFromPayoutInterval } from "./utils";

dotenv.config();

const EVERY_FIVE_MINUTES = "*/5 * * * *";

const app: Application = express();
const port = 3001;

const payer = Keypair.fromSecretKey(new Uint8Array(wallet));
const connection = new Connection(
  clusterApiUrl((process.env.CLUSTER as Cluster) ?? "devnet")
);

app.use("/healthcheck", (req: Request, res: Response, next: NextFunction) => {
  res.status(200).send({ data: "Healthy!" });
});

app.listen(port, () => {
  console.log(`Server is listening on port ${port}!`);
  console.log(`Cluster: ${process.env.CLUSTER != null || "devnet"}`);
  console.log(`Payer: ${payer.publicKey.toBase58()}`);

  // schedule the register to run every hour
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  cron.schedule(EVERY_FIVE_MINUTES, async (): Promise<void> => {
    await register(connection);
  });
});

async function register(connection: Connection): Promise<void> {
  const vaults = Vault.gpaBuilder();
  vaults.addFilter("accountDiscriminator", vaultDiscriminator);
  vaults.addFilter("autopay", true);

  const vaultAccounts = await vaults.run(connection);
  const vaultsStarted = vaultAccounts
    .map((it) => Vault.fromAccountInfo(it.account)[0])
    .filter(
      (it) =>
        Number(it.startDate.toString()) +
          Number(it.payoutInterval.toString()) <=
        Date.now() / 1000
    );
  console.log(`Found ${vaultsStarted.length} vaults`);

  const vaultTasks = createTasks(vaultsStarted);

  const toMark = [];
  for (let i = 0; i < vaultTasks.length; i++) {
    const vaultTask = vaultTasks[i];
    vaultTask.task.start();
    toMark.push(vaultTask.vault);
  }

  await markVaultAsRegistered(toMark);
}

function createTasks(vaultAccounts: Vault[]): Array<{
  task: ScheduledTask;
  vault: Vault;
}> {
  return vaultAccounts.map((vault: Vault) => {
    console.log(
      `Scheduling disbursement - Vault ID: ${vault.identifier.toString()} - ${cronToTimeStringWithSteps(
        cronFromPayoutInterval(vault.payoutInterval)
      )}`
    );

    return {
      vault,
      task: cron.schedule(
        cronFromPayoutInterval(vault.payoutInterval),
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        async (): Promise<void> => {
          await disburse(vault);
        },
        {
          scheduled: false,
        }
      ),
    };
  });
}

async function disburse(vault: Vault): Promise<void> {
  try {
    console.log(
      `Disbursing funds for Vault ID: ${vault.identifier.toString()}`
    );

    console.log(`Funds disbursed for Vault ID: ${vault.identifier.toString()}`);
  } catch (error) {
    console.error(
      `Error disbursing funds for Vault ID: ${vault.identifier.toString()}`
    );
    console.error(error);
  }
}

async function markVaultAsRegistered(vaults: Vault[]): Promise<void> {
  console.log("Marking vaults as registered");
  // try {
  //   console.log(
  //     `Marking Vault ID: ${vault.identifier.toString()} as registered`
  //   );
  // } catch (error) {
  //   console.error(
  //     `Error marking Vault ID: ${vault.identifier.toString()} as registered`
  //   );
  //   console.error(error);
  // }
}
