import * as anchor from "@coral-xyz/anchor";

import {
  CloseInstructionAccounts,
  PROGRAM_ID,
  Vault,
  createCloseInstruction,
  getMintWithCorrectTokenProgram,
  getPDAs,
} from "@valhalla/lib";
import { Transaction, sendAndConfirmTransaction } from "@solana/web3.js";
import { connection, payer } from "./network";

export const close = async (vault: Vault): Promise<void> => {
  const { tokenProgramId } = await getMintWithCorrectTokenProgram(
    connection,
    vault
  );

  const { vault: vaultKey, vaultAta } = getPDAs(
    PROGRAM_ID,
    new anchor.BN(vault.identifier),
    vault.creator,
    vault.mint
  );

  const accounts: CloseInstructionAccounts = {
    creator: vault.creator,
    vault: vaultKey,
    vaultAta,
    mint: vault.mint,
    tokenProgram: tokenProgramId,
  };

  const instruction = createCloseInstruction(accounts);
  const transaction = new Transaction().add(instruction);
  const tx = await sendAndConfirmTransaction(connection, transaction, [payer]);

  if (tx.length === 0) {
    console.error(`Error disbursing vault ${vault.identifier.toString()}`);
    return;
  }

  console.info(
    `Closed vault ${vault.identifier.toString()} - ${new Date().toLocaleString()} - Tx: ${tx}`
  );
};
