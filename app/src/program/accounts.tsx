import {
  Account,
  Mint,
  TOKEN_2022_PROGRAM_ID,
  getAccount,
  getAssociatedTokenAddressSync,
  getMint,
} from "@solana/spl-token";
import { Connection, PublicKey } from "@solana/web3.js";
import { LockAccount } from "models/types";

export const PROGRAM_ID = new PublicKey(
  "C572QduUUQuKezefbfFutKMgKA5uANzCu4LXXVHQbMEg"
);

export const TREASURY = new PublicKey(
  "5q3JmFVTcvn2GHo5zurZbTs1p8c2zsivFLeZAHz78ppb"
);

export const LOCK_SEED = Buffer.from("lock");
export const LOCKER_SEED = Buffer.from("locker");
export const LOCK_TOKEN_ACCOUNT_SEED = Buffer.from("token");

export const getTreasuryKey = (): PublicKey => {
  return TREASURY;
};

export const getLockerKey = (): PublicKey => {
  const [locker] = PublicKey.findProgramAddressSync([LOCKER_SEED], PROGRAM_ID);

  return locker;
};

export const getLockKey = (user: PublicKey, mint: PublicKey): PublicKey => {
  const [lock] = PublicKey.findProgramAddressSync(
    [user.toBuffer(), mint.toBuffer(), LOCK_SEED],
    PROGRAM_ID
  );

  return lock;
};

export const getLockTokenAccountKey = (
  lock: PublicKey,
  user: PublicKey,
  mint: PublicKey
): PublicKey => {
  const [lockTokenAccount] = PublicKey.findProgramAddressSync(
    [
      lock.toBuffer(),
      user.toBuffer(),
      mint.toBuffer(),
      LOCK_TOKEN_ACCOUNT_SEED,
    ],
    PROGRAM_ID
  );

  return lockTokenAccount;
};

export const getUserTokenAccountKey = (
  userKey: PublicKey,
  tokenMint: PublicKey
) => {
  return getAssociatedTokenAddressSync(
    tokenMint,
    userKey,
    false,
    TOKEN_2022_PROGRAM_ID
  );
};

export const getTheMint = async (
  connection: Connection,
  mint: PublicKey
): Promise<Mint> => {
  return await getMint(connection, mint, undefined, TOKEN_2022_PROGRAM_ID);
};

export function getPDAs(
  funder: PublicKey,
  mint: PublicKey
): [PublicKey, PublicKey, PublicKey] {
  const [locker] = PublicKey.findProgramAddressSync([LOCKER_SEED], PROGRAM_ID);
  const [lock] = PublicKey.findProgramAddressSync(
    [funder.toBuffer(), mint.toBuffer(), LOCK_SEED],
    PROGRAM_ID
  );
  const [lockTokenAccount] = PublicKey.findProgramAddressSync(
    [
      lock.toBuffer(),
      funder.toBuffer(),
      mint.toBuffer(),
      LOCK_TOKEN_ACCOUNT_SEED,
    ],
    PROGRAM_ID
  );

  return [locker, lock, lockTokenAccount];
}
