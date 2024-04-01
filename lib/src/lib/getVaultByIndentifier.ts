import { Vault, vaultDiscriminator } from "./program";

import { Connection } from "@solana/web3.js";
import { ValhallaVault } from "./models";

import BN = require("bn.js");

export const getVaultByIdentifier = async (
  connection: Connection,
  identifier: string
): Promise<ValhallaVault> => {
  const builder = await Vault.gpaBuilder();
  builder.addFilter("accountDiscriminator", vaultDiscriminator);
  builder.addFilter("identifier", new BN(identifier));

  return (await builder.run(connection)).map((v) => {
    const [vault] = Vault.fromAccountInfo(v.account);
    return new ValhallaVault(v.pubkey, vault, connection);
  })[0];
};
