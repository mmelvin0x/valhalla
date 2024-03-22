import {
  Autopay,
  PROGRAM_ID,
  Vault,
  createDisburseInstruction,
  vaultDiscriminator,
} from "./program";
import {
  type Connection,
  type GetProgramAccountsResponse,
  type PublicKey,
} from "@solana/web3.js";
import { canDisburseVault, cronFromPayoutInterval } from "./utils";
import cron, { type ScheduledTask } from "node-cron";
import type NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import { getValhallaConfig } from "./getValhallaConfig";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  type Mint,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  getMint,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import { sendTransaction } from "./sendTransactions";
import { getPDAs } from "./getPDAs";
import * as anchor from "@coral-xyz/anchor";
import WinstonLogger from "./logger";

export async function scheduleRegisteredVaults(
  connection: Connection,
  payer: NodeWallet,
  SCHEDULED_IDS: Set<number>,
): Promise<number[]> {
  const logger = WinstonLogger.logger();
  const registeredVaults = (await getRegisteredVaults(connection)).filter(
    (it) => !SCHEDULED_IDS.has(Number(it.identifier)),
  );

  logger.info(`Found ${registeredVaults.length} unscheduled vaults`);
  const vaultTasks = createTasks(connection, payer, registeredVaults);
  vaultTasks.forEach((vaultTask) => {
    vaultTask.task.start();
  });

  return vaultTasks.map((it) => Number(it.vault.identifier));
}

async function getTheMint(
  connection: Connection,
  vault: Vault,
): Promise<{ mint: Mint; tokenProgramId: PublicKey }> {
  try {
    return {
      mint: await getMint(connection, vault.mint),
      tokenProgramId: TOKEN_PROGRAM_ID,
    };
  } catch (error) {
    return {
      mint: await getMint(
        connection,
        vault.mint,
        undefined,
        TOKEN_2022_PROGRAM_ID,
      ),
      tokenProgramId: TOKEN_2022_PROGRAM_ID,
    };
  }
}

async function disburse(
  connection: Connection,
  payer: NodeWallet,
  vault: Vault,
): Promise<void> {
  const logger = WinstonLogger.logger();

  if (canDisburseVault(vault)) {
    const { config, key } = await getValhallaConfig(connection);
    const { tokenProgramId } = await getTheMint(connection, vault);
    const { vault: vaultKey, vaultAta } = getPDAs(
      PROGRAM_ID,
      new anchor.BN(vault.identifier),
      vault.creator,
      vault.mint,
    );

    const signerGovernanceAta = getAssociatedTokenAddressSync(
      vault.mint,
      payer.publicKey,
      false,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID,
    );

    const recipientAta = getAssociatedTokenAddressSync(
      vault.mint,
      vault.recipient,
      false,
      tokenProgramId,
      ASSOCIATED_TOKEN_PROGRAM_ID,
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
    logger.info(`Disbursed vault ${vault.identifier.toString()}`);

    await sendTransaction(connection, payer, [instruction]);
  } else {
    logger.info(
      `Vault ${vault.identifier.toString()} is not ready to disburse`,
    );
  }
}

async function getRegisteredVaults(connection: Connection): Promise<Vault[]> {
  const vaults = Vault.gpaBuilder();
  vaults.addFilter("accountDiscriminator", vaultDiscriminator);
  vaults.addFilter("autopay", Autopay.Registered);

  const vaultAccounts: GetProgramAccountsResponse =
    await vaults.run(connection);

  return vaultAccounts.map((it) => Vault.fromAccountInfo(it.account)[0]);
}

function createTasks(
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
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      async (): Promise<void> => {
        await disburse(connection, payer, vault);
      },
      {
        scheduled: false,
      },
    ),
  }));
}
