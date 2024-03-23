import {
  type Connection,
  type GetProgramAccountsResponse,
  type PublicKey,
} from "@solana/web3.js";
import { Config, configDiscriminator } from "@valhalla/lib";

export async function getValhallaConfig(
  connection: Connection
): Promise<{ config: Config; key: PublicKey }> {
  const config = Config.gpaBuilder();
  config.addFilter("accountDiscriminator", configDiscriminator);

  const configAccounts: GetProgramAccountsResponse = await config.run(
    connection
  );

  return {
    config: Config.fromAccountInfo(configAccounts[0].account)[0],
    key: configAccounts[0].pubkey,
  };
}
