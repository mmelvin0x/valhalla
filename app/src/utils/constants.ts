import { PROGRAM_ID } from "program";
import { PublicKey } from "@solana/web3.js";

export enum SubType {
  Created,
  Receivable,
}

export const TREASURY = new PublicKey(
  "5q3JmFVTcvn2GHo5zurZbTs1p8c2zsivFLeZAHz78ppb",
);

export const CONFIG_SEED = Buffer.from("config");

export const VESTING_SCHEDULT_SEED = Buffer.from("vesting_schedule");
export const VESTING_SCHEDULE_TOKEN_ACCOUNT_SEED = Buffer.from(
  "vesting_schedule_token_account",
);

export const TOKEN_LOCK_SEED = Buffer.from("token_lock");
export const TOKEN_LOCK_TOKEN_ACCOUNT_SEED = Buffer.from(
  "token_lock_token_account",
);

export const SCHEDULED_PAYMENT_SEED = Buffer.from("scheduled_payment");
export const SCHEDULED_PAYMENT_TOKEN_ACCOUNT_SEED = Buffer.from(
  "scheduled_payment_token_account",
);

export const getTreasuryKey = (): PublicKey => {
  return TREASURY;
};

interface ValhallaPDAs {
  config: PublicKey;
  vestingSchedule?: PublicKey;
  vestingScheduleTokenAccount?: PublicKey;
  tokenLock: PublicKey;
  tokenLockTokenAccount: PublicKey;
  scheduledPayment?: PublicKey;
  scheduledPaymentTokenAccount?: PublicKey;
}

export function getPDAs(
  creator: PublicKey,
  recipient: PublicKey | null,
  mint: PublicKey,
): ValhallaPDAs {
  let vestingSchedule: PublicKey | undefined;
  let vestingScheduleTokenAccount: PublicKey | undefined;
  let scheduledPayment: PublicKey | undefined;
  let scheduledPaymentTokenAccount: PublicKey | undefined;

  const [config] = PublicKey.findProgramAddressSync([CONFIG_SEED], PROGRAM_ID);

  if (recipient) {
    [vestingSchedule] = PublicKey.findProgramAddressSync(
      [
        creator.toBuffer(),
        recipient.toBuffer(),
        mint.toBuffer(),
        VESTING_SCHEDULT_SEED,
      ],
      PROGRAM_ID,
    );
    [vestingScheduleTokenAccount] = PublicKey.findProgramAddressSync(
      [vestingSchedule.toBuffer(), VESTING_SCHEDULE_TOKEN_ACCOUNT_SEED],
      PROGRAM_ID,
    );

    [scheduledPayment] = PublicKey.findProgramAddressSync(
      [
        creator.toBuffer(),
        recipient.toBuffer(),
        mint.toBuffer(),
        SCHEDULED_PAYMENT_SEED,
      ],
      PROGRAM_ID,
    );
    [scheduledPaymentTokenAccount] = PublicKey.findProgramAddressSync(
      [scheduledPayment.toBuffer(), SCHEDULED_PAYMENT_TOKEN_ACCOUNT_SEED],
      PROGRAM_ID,
    );
  }

  const [tokenLock] = PublicKey.findProgramAddressSync(
    [creator.toBuffer(), mint.toBuffer(), TOKEN_LOCK_SEED],
    PROGRAM_ID,
  );
  const [tokenLockTokenAccount] = PublicKey.findProgramAddressSync(
    [tokenLock.toBuffer(), TOKEN_LOCK_TOKEN_ACCOUNT_SEED],
    PROGRAM_ID,
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
