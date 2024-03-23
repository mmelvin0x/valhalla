import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import { PROGRAM_ID, type Vault, createDisburseInstruction } from "./program";

import { type Connection } from "@solana/web3.js";
import type NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import WinstonLogger from "./logger";
import { canDisburseVault } from "./utils";
import { getMintWithCorrectTokenProgram } from "./getMintWithCorrectTokenProgram";
import { getPDAs } from "./getPDAs";
import { getValhallaConfig } from "./getValhallaConfig";
import { sendTransaction } from "./sendTransactions";

export async function disburse(
  connection: Connection,
  payer: NodeWallet,
  vault: Vault,
): Promise<void> {
  const logger = WinstonLogger.logger();

  if (canDisburseVault(vault)) {
    logger.info("\nDisbursing vault " + vault.identifier.toString() + "...");
    const { config, key } = await getValhallaConfig(connection);
    const { tokenProgramId } = await getMintWithCorrectTokenProgram(
      connection,
      vault,
    );
    const { vault: vaultKey, vaultAta } = getPDAs(
      PROGRAM_ID,
      vault.identifier,
      vault.creator,
      vault.mint,
    );

    const signerGovernanceAta = getAssociatedTokenAddressSync(
      vault.mint,
      payer.publicKey,
      false,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID,
    );

    const recipientAta = getAssociatedTokenAddressSync(
      vault.mint,
      vault.recipient,
      false,
      tokenProgramId,
      ASSOCIATED_TOKEN_PROGRAM_ID,
    );

    const instruction = createDisburseInstruction({
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
      governanceTokenMint: config.governanceTokenMintKey,
      tokenProgram: tokenProgramId,
      governanceTokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
    });

    const tx = await sendTransaction(connection, payer, [instruction]);

    if (tx.length === 0) {
      logger.error(`Error disbursing vault ${vault.identifier.toString()}\n`);
      return;
    }

    logger.info(
      `Disbursed vault ${vault.identifier.toString()} at ${new Date().toLocaleString()}. Tx: ${tx}\n`,
    );
  }
}
