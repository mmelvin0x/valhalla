import * as anchor from "@coral-xyz/anchor";

import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import {
  DisburseInstructionAccounts,
  PROGRAM_ID,
  Vault,
  createDisburseInstruction,
  getMintWithCorrectTokenProgram,
  getPDAs,
  getValhallaConfig,
} from "@valhalla/lib";
import { connection, payer } from "./network";

export const disburse = async (vault: Vault) => {
  const { config, key } = await getValhallaConfig(connection);
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

  const signerGovernanceAta = getAssociatedTokenAddressSync(
    config.governanceTokenMintKey,
    payer.publicKey,
    false,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );

  const creatorGovernanceAta = getAssociatedTokenAddressSync(
    config.governanceTokenMintKey,
    vault.creator,
    false,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );

  const recipientAta = getAssociatedTokenAddressSync(
    vault.mint,
    vault.recipient,
    false,
    tokenProgramId,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );

  const accounts: DisburseInstructionAccounts = {
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
    creatorGovernanceAta,
    governanceTokenMint: config.governanceTokenMintKey,
    tokenProgram: tokenProgramId,
    governanceTokenProgram: TOKEN_PROGRAM_ID,
    associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
  };

  const instruction = createDisburseInstruction(accounts);

  return instruction;
};
