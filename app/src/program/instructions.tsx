import { Program } from "@coral-xyz/anchor";
import { PublicKey, Transaction } from "@solana/web3.js";
import { Valhalla } from "./valhalla";
import * as anchor from "@coral-xyz/anchor";
import {
  LOCKER_SEED,
  LOCK_SEED,
  LOCK_TOKEN_ACCOUNT_SEED,
  LockAccount,
  TREASURY,
  getLockKey,
  getLockTokenAccountKey,
  getLockerKey,
} from "./accounts";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";

export const createLock = async (
  user: PublicKey,
  unlockDate: number,
  depositAmount: number,
  mint: PublicKey,
  program: Program<Valhalla>
): Promise<Transaction> => {
  const amount = new anchor.BN(depositAmount);
  const date = new anchor.BN(Math.floor(unlockDate / 1000));
  const locker = getLockerKey();
  const treasury = TREASURY;
  const lock = getLockKey(user, mint);
  const lockTokenAccount = getLockTokenAccountKey(lock, user, mint);
  const userTokenAccount = getAssociatedTokenAddressSync(mint, user);

  return new Transaction().add(
    await program.methods
      .createLock(date, amount)
      .accounts({
        user,
        locker,
        treasury,
        lock,
        lockTokenAccount,
        userTokenAccount,
        mint,
      })
      .transaction()
  );
};

export const depositToLock = async (
  user: PublicKey,
  depositAmount: number,
  lock: LockAccount,
  program: Program<Valhalla>
): Promise<Transaction> =>
  new Transaction().add(
    await program.methods
      .depositToLock(new anchor.BN(depositAmount.toString()))
      .accounts({
        user,
        lock: lock.publicKey,
        lockTokenAccount: lock.lockTokenAccount.address,
        userTokenAccount: lock.userTokenAccount.address,
        mint: lock.mint.address,
      })
      .transaction()
  );

export const extendLock = async (
  user: PublicKey,
  unlockDate: number,
  lock: LockAccount,
  program: Program<Valhalla>
): Promise<Transaction> =>
  new Transaction().add(
    await program.methods
      .extendLock(new anchor.BN(Math.floor(unlockDate / 1000)))
      .accounts({
        user,
        lock: lock.publicKey,
        mint: lock.mint.address,
      })
      .transaction()
  );

export const WithdrawToBeneficiary = async (
  user: PublicKey,
  withdrawAmount: number,
  lock: LockAccount,
  program: Program<Valhalla>
): Promise<Transaction> =>
  new Transaction().add(
    await program.methods
      .WithdrawToBeneficiary(new anchor.BN(withdrawAmount.toString()))
      .accounts({
        user,
        lock: lock.publicKey,
        lockTokenAccount: lock.lockTokenAccount.address,
        userTokenAccount: lock.userTokenAccount.address,
        mint: lock.mint.address,
      })
      .transaction()
  );

export const closeLock = async (
  user: PublicKey,
  lock: LockAccount,
  program: Program<Valhalla>
): Promise<Transaction> =>
  new Transaction().add(
    await program.methods
      .closeLock()
      .accounts({
        user,
        lock: lock.publicKey,
        lockTokenAccount: lock.lockTokenAccount.address,
        userTokenAccount: lock.userTokenAccount.address,
        mint: lock.mint.address,
      })
      .transaction()
  );
