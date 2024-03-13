import { AnchorProvider, Program } from "@coral-xyz/anchor";
import { Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";

import { Account } from "@solana/spl-token";
import { Valhalla } from "../../target/types/valhalla";
import { airdrop } from "./airdrop";
import { mintTransferFeeTokens } from "./mintTransferFeeTokens";

export enum Authority {
  Neither,
  Creator,
  Recipient,
  Both,
}

export const decimals = 9;
export const feeBasisPoints = 100;
export const maxFee = BigInt(10_000 * LAMPORTS_PER_SOL);
export const amountMinted = 10_000_000_000;

export const CONFIG_SEED = Buffer.from("config");

export const VAULT_SEED = Buffer.from("vault");
export const VAULT_ATA_SEED = Buffer.from("vault_ata");

export interface ValhallaPDAs {
  config: PublicKey;
  vestingSchedule: PublicKey;
  vestingScheduleTokenAccount: PublicKey;
  tokenLock: PublicKey;
  tokenLockTokenAccount: PublicKey;
  scheduledPayment: PublicKey;
  scheduledPaymentTokenAccount: PublicKey;
}

export const setupTestAccounts = async (
  provider: AnchorProvider,
  payer: Keypair,
  creator: Keypair,
  recipient: Keypair
): Promise<[PublicKey, Account, Account]> => {
  await airdrop(provider.connection, payer.publicKey);
  await airdrop(provider.connection, creator.publicKey);
  await airdrop(provider.connection, recipient.publicKey);

  const [mint, creatorTokenAccount, recipientTokenAccount] =
    await mintTransferFeeTokens(
      provider.connection,
      payer,
      decimals,
      feeBasisPoints,
      maxFee,
      creator,
      recipient,
      amountMinted
    );

  return [mint, creatorTokenAccount, recipientTokenAccount];
};
