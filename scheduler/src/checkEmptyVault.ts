import * as anchor from "@coral-xyz/anchor";

import {
  PROGRAM_ID,
  ValhallaVault,
  Vault,
  getMintWithCorrectTokenProgram,
  getPDAs,
} from "@valhalla/lib";

import { connection } from "./network";
import { getAccount } from "@solana/spl-token";

export const checkEmptyVault = async (
  vault: Vault | ValhallaVault
): Promise<boolean> => {
  const { vaultAta } = getPDAs(
    PROGRAM_ID,
    new anchor.BN(vault.identifier),
    vault.creator,
    vault.mint
  );

  const { tokenProgramId } = await getMintWithCorrectTokenProgram(
    connection,
    vault
  );

  const vaultAtaAccount = await getAccount(
    connection,
    vaultAta,
    undefined,
    tokenProgramId
  );

  return vaultAtaAccount.amount.toString() === "0";
};
