import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import {
  Config,
  DisburseInstructionAccounts,
  PROGRAM_ID,
  ValhallaVault,
  createDisburseInstruction,
  getPDAs,
} from "@valhalla/lib";

import { Connection } from "@solana/web3.js";
import { WalletContextState } from "@solana/wallet-adapter-react";
import { sendTransaction } from "../utils/sendTransaction";
import { toast } from "react-toastify";

export const disburse = async (
  connection: Connection,
  vault: ValhallaVault,
  wallet: WalletContextState
) => {
  if (
    !wallet.publicKey ||
    !vault.vaultAta ||
    !vault.recipientAtaAddress ||
    !vault.tokenProgramId
  ) {
    toast.error("Missing wallet or vault data");
    return;
  }

  const { config } = getPDAs(
    PROGRAM_ID,
    vault.identifier,
    vault.creator,
    vault.mint
  );
  const configAccount = await Config.fromAccountAddress(connection, config);

  const userGovernanceAta = getAssociatedTokenAddressSync(
    configAccount.governanceTokenMintKey,
    wallet.publicKey,
    false,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );

  const accounts: DisburseInstructionAccounts = {
    signer: wallet.publicKey,
    creator: vault.creator,
    recipient: vault.recipient,
    vault: vault.key,
    vaultAta: vault.vaultAta.address,
    mint: vault.mint,
    devTreasury: configAccount.devTreasury,
    config,
    signerGovernanceAta: userGovernanceAta,
    recipientAta: vault.recipientAtaAddress,
    governanceTokenMint: configAccount.governanceTokenMintKey,
    governanceTokenProgram: TOKEN_PROGRAM_ID,
    tokenProgram: vault.tokenProgramId,
    associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
  };

  const instructions = [createDisburseInstruction(accounts)];

  toast.info(`Tx 1/1: Disbursing vault`, { toastId: "disburse" });
  await sendTransaction(connection, wallet, instructions, "disburse");
};
