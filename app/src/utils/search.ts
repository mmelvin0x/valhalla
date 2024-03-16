import { Connection, PublicKey } from "@solana/web3.js";
import { ScheduledPayment, TokenLock, Vault, VestingType } from "program";

import { ValhallaVault } from "models/models";
import { getNameArg } from "./formatters";

export const searchVaults = async (
  connection: Connection,
  userKey?: PublicKey,
  search?: string,
) => {
  const created = await Vault.gpaBuilder();
  const recipient = await Vault.gpaBuilder();

  if (userKey) {
    created.addFilter("creator", userKey);
    recipient.addFilter("recipient", userKey);
  }

  if (search) {
    created.addFilter("name", getNameArg(search));
    recipient.addFilter("name", getNameArg(search));
  }

  const fMapped = (await created.run(connection)).map((v) => {
    const [vs] = Vault.fromAccountInfo(v.account);
    return new ValhallaVault(v.pubkey, vs, connection);
  });
  const rMapped = (await recipient.run(connection)).map((v) => {
    const [vs] = Vault.fromAccountInfo(v.account);
    return new ValhallaVault(v.pubkey, vs, connection);
  });

  return {
    created: fMapped,
    recipient: rMapped,
  };
};
