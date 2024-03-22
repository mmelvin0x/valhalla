import type NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import {
  type TransactionInstruction,
  type Connection,
  type PublicKey,
  type GetProgramAccountsResponse,
} from "@solana/web3.js";
import { getValhallaConfig } from "./getValhallaConfig";
import {
  Autopay,
  createRegisterAutopayInstruction,
  vaultDiscriminator,
  Vault,
} from "./program";
import { batchSendTransactions } from "./sendTransactions";
import WinstonLogger from "./logger";

export async function registerVaults(
  connection: Connection,
  payer: NodeWallet,
  REGISTERED_IDS: Set<number>,
): Promise<Set<number>> {
  const logger = WinstonLogger.logger();
  const unregisteredVaults: Array<{ vault: Vault; key: PublicKey }> = (
    await getUnregisteredVaults(connection)
  ).filter((it) => !REGISTERED_IDS.has(Number(it.vault.identifier)));

  logger.info(`Found ${unregisteredVaults.length} unregistered vaults`);
  const instructions = await getRegistrationInstructions(
    connection,
    payer.publicKey,
    unregisteredVaults,
  );

  instructions.filter((it) => !REGISTERED_IDS.has(Number(it.vault.identifier)));

  const registeredIds: number[] = await batchSendTransactions(
    connection,
    payer,
    instructions,
  );

  return new Set(registeredIds);
}

async function getUnregisteredVaults(
  connection: Connection,
): Promise<Array<{ vault: Vault; key: PublicKey }>> {
  const vaults = Vault.gpaBuilder();
  vaults.addFilter("accountDiscriminator", vaultDiscriminator);
  vaults.addFilter("autopay", Autopay.NotRegistered);

  const vaultAccounts: GetProgramAccountsResponse =
    await vaults.run(connection);

  return vaultAccounts.map((it) => ({
    vault: Vault.fromAccountInfo(it.account)[0],
    key: it.pubkey,
  }));
}

async function getRegistrationInstructions(
  connection: Connection,
  payer: PublicKey,
  unregisteredVaults: Array<{ vault: Vault; key: PublicKey }>,
): Promise<Array<{ vault: Vault; instruction: TransactionInstruction }>> {
  const { key } = await getValhallaConfig(connection);
  return unregisteredVaults.map((it) => {
    const vault = it.vault;

    return {
      vault,
      instruction: createRegisterAutopayInstruction({
        admin: payer,
        creator: vault.creator,
        config: key,
        vault: it.key,
        mint: vault.mint,
      }),
    };
  });
}
