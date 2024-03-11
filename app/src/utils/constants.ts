import { PROGRAM_ID } from "program";
import { PublicKey } from "@solana/web3.js";

export enum SubType {
  Created,
  Receivable,
}

export const WRAPPED_SOL_MINT_KEY = new PublicKey(
  "So11111111111111111111111111111111111111112",
);

export const TREASURY = new PublicKey(
  "5q3JmFVTcvn2GHo5zurZbTs1p8c2zsivFLeZAHz78ppb",
);

export const CONFIG_SEED = Buffer.from("config");

export const VAULT_SEED = Buffer.from("vault");
export const VAULT_ATA_SEED = Buffer.from("vault_ata");

export const VAULT_SEED = Buffer.from("token_lock");
export const VAULT_ATA_SEED = Buffer.from("vault_ata");

export const VAULT_SEED = Buffer.from("vault");
export const VAULT_ATA_SEED = Buffer.from("vault_ata");

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
      [creator.toBuffer(), recipient.toBuffer(), mint.toBuffer(), VAULT_SEED],
      PROGRAM_ID,
    );
    [vestingScheduleTokenAccount] = PublicKey.findProgramAddressSync(
      [vestingSchedule.toBuffer(), VAULT_ATA_SEED],
      PROGRAM_ID,
    );

    [scheduledPayment] = PublicKey.findProgramAddressSync(
      [creator.toBuffer(), recipient.toBuffer(), mint.toBuffer(), VAULT_SEED],
      PROGRAM_ID,
    );
    [scheduledPaymentTokenAccount] = PublicKey.findProgramAddressSync(
      [scheduledPayment.toBuffer(), VAULT_ATA_SEED],
      PROGRAM_ID,
    );
  }

  const [tokenLock] = PublicKey.findProgramAddressSync(
    [creator.toBuffer(), mint.toBuffer(), VAULT_SEED],
    PROGRAM_ID,
  );
  const [tokenLockTokenAccount] = PublicKey.findProgramAddressSync(
    [tokenLock.toBuffer(), VAULT_ATA_SEED],
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
