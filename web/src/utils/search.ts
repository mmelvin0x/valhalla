import { Connection, PublicKey } from "@solana/web3.js";
import {
  ValhallaVault,
  Vault,
  getNameArg,
  vaultDiscriminator,
} from "@valhalla/lib";

export const searchMyVaults = async (
  connection: Connection,
  userKey?: PublicKey,
  name?: string
): Promise<{ created: ValhallaVault[]; recipient: ValhallaVault[] }> => {
  const created = await Vault.gpaBuilder();
  const recipient = await Vault.gpaBuilder();

  created.addFilter("accountDiscriminator", vaultDiscriminator);
  recipient.addFilter("accountDiscriminator", vaultDiscriminator);

  if (userKey) {
    created.addFilter("creator", userKey);
    recipient.addFilter("recipient", userKey);
  }

  if (name) {
    created.addFilter("name", getNameArg(name));
    recipient.addFilter("name", getNameArg(name));
  }

  const fMapped = (await created.run(connection)).map((v) => {
    const [vault] = Vault.fromAccountInfo(v.account);
    return new ValhallaVault(v.pubkey, vault, connection);
  });
  const rMapped = (await recipient.run(connection)).map((v) => {
    const [vault] = Vault.fromAccountInfo(v.account);
    return new ValhallaVault(v.pubkey, vault, connection);
  });

  return {
    created: fMapped,
    recipient: rMapped,
  };
};

// TODO: pagination is being ignored
export const searchAllVaults = async (
  connection: Connection,
  page: number,
  perPage: number,
  name?: string,
  creator?: PublicKey,
  recipient?: PublicKey,
  mint?: PublicKey
): Promise<ValhallaVault[]> => {
  const builder = await Vault.gpaBuilder();
  builder.addFilter("accountDiscriminator", vaultDiscriminator);
  builder.config.dataSlice = {
    offset: page * perPage,
    length: perPage * Vault.byteSize,
  };

  if (name) {
    builder.addFilter("name", getNameArg(name));
  }

  if (creator) {
    builder.addFilter("creator", creator);
  }

  if (recipient) {
    builder.addFilter("recipient", recipient);
  }

  if (mint) {
    builder.addFilter("mint", mint);
  }

  return (await builder.run(connection)).map((v) => {
    const [vs] = Vault.fromAccountInfo(v.account);
    return new ValhallaVault(v.pubkey, vs, connection);
  });
};
