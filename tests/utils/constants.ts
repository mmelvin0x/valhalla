import { AnchorProvider, Program } from "@coral-xyz/anchor";
import { Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";

import { Account } from "@solana/spl-token";
import { Valhalla } from "../../target/types/valhalla";
import { airdrop } from "./airdrop";
import { mintTransferFeeTokens } from "./mintTransferFeeTokens";

export enum Authority {
  Neither,
  Funder,
  Recipient,
  Both,
}

export const decimals = 9;
export const feeBasisPoints = 100;
export const maxFee = BigInt(10_000 * LAMPORTS_PER_SOL);
export const amountMinted = 10_000_000_000;

export const CONFIG_SEED = Buffer.from("config");

export const VESTING_SCHEDULT_SEED = Buffer.from("vesting_schedule");
export const VESTING_SCHEDULE_TOKEN_ACCOUNT_SEED = Buffer.from(
  "vesting_schedule_token_account"
);

export const TOKEN_LOCK_SEED = Buffer.from("token_lock");
export const TOKEN_LOCK_TOKEN_ACCOUNT_SEED = Buffer.from(
  "token_lock_token_account"
);

export const SCHEDULED_PAYMENT_SEED = Buffer.from("scheduled_payment");
export const SCHEDULED_PAYMENT_TOKEN_ACCOUNT_SEED = Buffer.from(
  "scheduled_payment_token_account"
);

export interface ValhallaPDAs {
  config: PublicKey;
  vestingSchedule: PublicKey;
  vestingScheduleTokenAccount: PublicKey;
  tokenLock: PublicKey;
  tokenLockTokenAccount: PublicKey;
  scheduledPayment: PublicKey;
  scheduledPaymentTokenAccount: PublicKey;
}

export function getPDAs(
  programId: PublicKey,
  creator: PublicKey | null,
  recipient: PublicKey | null,
  mint: PublicKey | null
): ValhallaPDAs {
  const [config] = PublicKey.findProgramAddressSync([CONFIG_SEED], programId);

  const [vestingSchedule] =
    creator && recipient && mint
      ? PublicKey.findProgramAddressSync(
          [
            creator.toBuffer(),
            recipient.toBuffer(),
            mint.toBuffer(),
            VESTING_SCHEDULT_SEED,
          ],
          programId
        )
      : [null];
  const [vestingScheduleTokenAccount] = vestingSchedule
    ? PublicKey.findProgramAddressSync(
        [vestingSchedule.toBuffer(), VESTING_SCHEDULE_TOKEN_ACCOUNT_SEED],
        programId
      )
    : [null];

  const [tokenLock] =
    creator && mint
      ? PublicKey.findProgramAddressSync(
          [creator.toBuffer(), mint.toBuffer(), TOKEN_LOCK_SEED],
          programId
        )
      : [null];
  const [tokenLockTokenAccount] = tokenLock
    ? PublicKey.findProgramAddressSync(
        [tokenLock.toBuffer(), TOKEN_LOCK_TOKEN_ACCOUNT_SEED],
        programId
      )
    : [null];

  const [scheduledPayment] =
    creator && recipient && mint
      ? PublicKey.findProgramAddressSync(
          [
            creator.toBuffer(),
            recipient.toBuffer(),
            mint.toBuffer(),
            SCHEDULED_PAYMENT_SEED,
          ],
          programId
        )
      : [null];
  const [scheduledPaymentTokenAccount] = scheduledPayment
    ? PublicKey.findProgramAddressSync(
        [scheduledPayment.toBuffer(), SCHEDULED_PAYMENT_TOKEN_ACCOUNT_SEED],
        programId
      )
    : [null];

  return {
    config,
    vestingSchedule,
    vestingScheduleTokenAccount,
    tokenLock,
    tokenLockTokenAccount,
    scheduledPayment,
    scheduledPaymentTokenAccount,
  };
}

export const setupTestAccounts = async (
  provider: AnchorProvider,
  payer: Keypair,
  creator: Keypair,
  recipient: Keypair,
  program: Program<Valhalla>
): Promise<[PublicKey, Account, Account, ValhallaPDAs]> => {
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

  const pdas = getPDAs(
    program.programId,
    creator.publicKey,
    recipient.publicKey,
    mint
  );

  return [mint, creatorTokenAccount, recipientTokenAccount, pdas];
};
