import { PublicKey } from "@solana/web3.js";
import { PROGRAM_ID } from "program";

export enum Tab {
  Recipient,
  Funder,
}

export const TREASURY = new PublicKey(
  "5q3JmFVTcvn2GHo5zurZbTs1p8c2zsivFLeZAHz78ppb",
);

export const LOCK_SEED = Buffer.from("lock");
export const LOCKER_SEED = Buffer.from("locker");
export const LOCK_TOKEN_ACCOUNT_SEED = Buffer.from("token");

export const getTreasuryKey = (): PublicKey => {
  return TREASURY;
};

export function getPDAs(
  funder: PublicKey,
  mint: PublicKey,
): [PublicKey, PublicKey, PublicKey] {
  const [locker] = PublicKey.findProgramAddressSync([LOCKER_SEED], PROGRAM_ID);
  const [lock] = PublicKey.findProgramAddressSync(
    [funder.toBuffer(), mint.toBuffer(), LOCK_SEED],
    PROGRAM_ID,
  );
  const [lockTokenAccount] = PublicKey.findProgramAddressSync(
    [
      lock.toBuffer(),
      funder.toBuffer(),
      mint.toBuffer(),
      LOCK_TOKEN_ACCOUNT_SEED,
    ],
    PROGRAM_ID,
  );

  return [locker, lock, lockTokenAccount];
}
