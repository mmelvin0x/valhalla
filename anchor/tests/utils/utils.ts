import * as anchor from "@coral-xyz/anchor";

import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  Account,
  TOKEN_2022_PROGRAM_ID,
  getOrCreateAssociatedTokenAccount,
} from "@solana/spl-token";
import { Commitment, Connection, Keypair, PublicKey } from "@solana/web3.js";

import { AnchorProvider } from "@coral-xyz/anchor";
import { Valhalla } from "../../target/types/valhalla";
import { airdrop } from "./airdrop";
import { mintTransferFeeTokens } from "./mintTransferFeeTokens";

export enum Authority {
  Neither,
  Creator,
  Recipient,
  Both,
}

export const decimals = 6;
export const feeBasisPoints = 100;
export const maxFee = 100 * 10 ** decimals;
export const amountMinted = 1_000_000;
export const calcExpectedAmount = (
  amount: number,
  feeBasisPoints: number,
  decimals: number,
  maxFee: number
) => {
  const actualAmount = BigInt(amount * 10 ** decimals);
  const fee = BigInt((actualAmount * BigInt(feeBasisPoints)) / BigInt(10_000));

  return fee > maxFee ? maxFee : actualAmount - fee;
};

export const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const confirm = async (
  connection: Connection,
  signature: string,
  commitment = "confirmed" as Commitment
): Promise<string> => {
  const block = await connection.getLatestBlockhash();
  await connection.confirmTransaction(
    {
      signature,
      ...block,
    },
    commitment
  );

  return signature;
};

export const getName = (name: string) => {
  const nameArg = [];
  const name_ = anchor.utils.bytes.utf8.encode(name);
  name_.forEach((byte, i) => {
    if (i < 32) {
      // @ts-expect-error - Buffer is not an array
      nameArg.push(byte);
    }
  });

  return nameArg;
};

export const getNowInSeconds = () => new anchor.BN(Date.now() / 1000);

export const getAuthority = (
  authority: Authority,
  program: anchor.Program<Valhalla>
) =>
  program.coder.types.decode("Authority", new anchor.BN(authority).toBuffer());

export const CONFIG_SEED = Buffer.from("config");
export const VAULT_SEED = Buffer.from("vault");
export const VAULT_ATA_SEED = Buffer.from("vault_ata");
export const GOVERNANCE_TOKEN_MINT_SEED = Buffer.from("governance_token_mint");

export const setupTestAccounts = async (
  provider: AnchorProvider,
  payer: Keypair,
  creator: Keypair,
  recipient: Keypair,
  user: Keypair,
  daoTreasury: Keypair
): Promise<[PublicKey, Account, Account, Account]> => {
  await airdrop(provider.connection, payer.publicKey);
  await airdrop(provider.connection, creator.publicKey);
  await airdrop(provider.connection, recipient.publicKey);
  await airdrop(provider.connection, user.publicKey);
  await airdrop(provider.connection, daoTreasury.publicKey);

  const [mint, creatorTokenAccount, recipientTokenAccount] =
    await mintTransferFeeTokens(
      provider.connection,
      payer,
      decimals,
      feeBasisPoints,
      BigInt(maxFee),
      creator,
      recipient,
      amountMinted
    );

  const daoTreasuryTokenAccount = await getOrCreateAssociatedTokenAccount(
    provider.connection,
    payer,
    mint,
    daoTreasury.publicKey,
    true,
    undefined,
    undefined,
    TOKEN_2022_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );

  return [
    mint,
    creatorTokenAccount,
    recipientTokenAccount,
    daoTreasuryTokenAccount,
  ];
};
