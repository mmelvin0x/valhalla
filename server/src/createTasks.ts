import { type Connection } from "@solana/web3.js";
import { cronFromPayoutInterval } from "./utils";
import cron, { type ScheduledTask } from "node-cron";
import type NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import { disburse } from "./disburse";
import { type Vault } from "./program";

export function createTasks(
  connection: Connection,
  payer: NodeWallet,
  vaults: Vault[],
): Array<{
  task: ScheduledTask;
  vault: Vault;
}> {
  return vaults.map((vault: Vault) => ({
    vault,
    task: cron.schedule(
      cronFromPayoutInterval(vault.payoutInterval),
      (): void => {
        void disburse(connection, payer, vault);
      },
      { scheduled: false },
    ),
  }));
}
