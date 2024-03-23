import {
  type Connection,
  type GetProgramAccountsResponse,
} from "@solana/web3.js";
import { Vault, vaultDiscriminator } from "@valhalla/lib";

export async function getVaultsToSchedule(
  connection: Connection
): Promise<Vault[]> {
  const vaults = Vault.gpaBuilder();
  vaults.addFilter("accountDiscriminator", vaultDiscriminator);
  vaults.addFilter("autopay", true);

  const vaultAccounts: GetProgramAccountsResponse = await vaults.run(
    connection
  );

  return vaultAccounts.map((it) => Vault.fromAccountInfo(it.account)[0]);
}
