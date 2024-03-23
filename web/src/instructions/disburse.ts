import * as anchor from "@coral-xyz/anchor";

import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import {
  Connection,
  PublicKey,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import {
  DisburseInstructionAccounts,
  ValhallaVault,
  createDisburseInstruction,
  getPDAs,
  shortenSignature,
} from "@valhalla/lib";

import { Valhalla } from "@valhalla/anchor";
import { WalletContextState } from "@solana/wallet-adapter-react";
import { notify } from "../utils/notifications";

export const disburse = async (
  connection: Connection,
  userKey: PublicKey,
  vault: ValhallaVault,
  wallet: WalletContextState,
  program: anchor.Program<Valhalla>
) => {
  if (
    !wallet.publicKey ||
    !vault.vaultAta ||
    !vault.recipientAta ||
    !vault.tokenProgramId
  )
    return;

  const { config } = getPDAs(vault.identifier, vault.creator, vault.mint);
  const configAccount = await program.account.config.fetch(config);

  const userGovernanceAta = getAssociatedTokenAddressSync(
    configAccount.governanceTokenMintKey,
    userKey,
    false,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );

  const accounts: DisburseInstructionAccounts = {
    signer: userKey,
    creator: vault.creator,
    recipient: vault.recipient,
    vault: vault.key,
    vaultAta: vault.vaultAta.address,
    mint: vault.mint,
    devTreasury: configAccount.devTreasury,
    config,
    signerGovernanceAta: userGovernanceAta,
    recipientAta: vault.recipientAta.address,
    governanceTokenMint: configAccount.governanceTokenMintKey,
    governanceTokenProgram: TOKEN_PROGRAM_ID,
    tokenProgram: vault.tokenProgramId,
    associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
  };

  const instructions = [createDisburseInstruction(accounts)];

  const latestBlockhash = await connection.getLatestBlockhash();
  const messageV0 = new TransactionMessage({
    instructions,
    payerKey: wallet.publicKey,
    recentBlockhash: latestBlockhash.blockhash,
  }).compileToV0Message();

  const tx = new VersionedTransaction(messageV0);
  const txid = await wallet.sendTransaction(tx, connection);
  const confirmation = await connection.confirmTransaction({
    signature: txid,
    blockhash: latestBlockhash.blockhash,
    lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
  });

  if (confirmation.value.err) {
    notify({
      message: "Transaction Failed",
      description: `Transaction ${shortenSignature(txid)} failed (${
        confirmation.value.err
      })`,
      type: "error",
    });
  }

  notify({
    message: "Transaction sent",
    description: `Transaction ${shortenSignature(txid)} has been sent`,
    type: "success",
  });
};
