import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import {
  DisburseInstructionAccounts,
  createDisburseInstruction,
} from "program";
import { SOL_TREASURY, getPDAs } from "utils/constants";

import BaseModel from "models/models";
import { PublicKey } from "@solana/web3.js";

export const disburseVaultInstruction = (
  userKey: PublicKey,
  vault: BaseModel,
) => {
  const { config, governanceTokenMint } = getPDAs(
    vault.identifier,
    vault.creator,
    vault.mint,
  );

  const userGovernanceAta = getAssociatedTokenAddressSync(
    governanceTokenMint,
    userKey,
    false,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID,
  );

  const accounts: DisburseInstructionAccounts = {
    signer: userKey,
    creator: vault.creator,
    recipient: vault.recipient,
    vault: vault.key,
    vaultAta: vault.vaultAta.address,
    mint: vault.mint,
    solTreasury: SOL_TREASURY,
    config,
    signerGovernanceAta: userGovernanceAta,
    recipientAta: vault.recipientAta.address,
    governanceTokenMint,
    governanceTokenProgram: TOKEN_PROGRAM_ID,
    tokenProgram: vault.tokenProgramId,
    associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
  };

  return createDisburseInstruction(accounts);
};
