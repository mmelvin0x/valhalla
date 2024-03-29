import { PublicKey } from "@solana/web3.js";

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
  creator: PublicKey,
  recipient: PublicKey,
  mint: PublicKey
): ValhallaPDAs {
  const [config] = PublicKey.findProgramAddressSync([CONFIG_SEED], programId);

  const [vestingSchedule] = PublicKey.findProgramAddressSync(
    [
      creator.toBuffer(),
      recipient.toBuffer(),
      mint.toBuffer(),
      VESTING_SCHEDULT_SEED,
    ],
    programId
  );
  const [vestingScheduleTokenAccount] = PublicKey.findProgramAddressSync(
    [vestingSchedule.toBuffer(), VESTING_SCHEDULE_TOKEN_ACCOUNT_SEED],
    programId
  );

  const [tokenLock] = PublicKey.findProgramAddressSync(
    [creator.toBuffer(), mint.toBuffer(), TOKEN_LOCK_SEED],
    programId
  );
  const [tokenLockTokenAccount] = PublicKey.findProgramAddressSync(
    [tokenLock.toBuffer(), TOKEN_LOCK_TOKEN_ACCOUNT_SEED],
    programId
  );

  const [scheduledPayment] = PublicKey.findProgramAddressSync(
    [
      creator.toBuffer(),
      recipient.toBuffer(),
      mint.toBuffer(),
      SCHEDULED_PAYMENT_SEED,
    ],
    programId
  );
  const [scheduledPaymentTokenAccount] = PublicKey.findProgramAddressSync(
    [scheduledPayment.toBuffer(), SCHEDULED_PAYMENT_TOKEN_ACCOUNT_SEED],
    programId
  );

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
