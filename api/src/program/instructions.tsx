import { Program } from "@coral-xyz/anchor";
import {
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import { Valhalla } from "./valhalla";
import * as anchor from "@coral-xyz/anchor";
import {
  LockAccount,
  getLockKey,
  getLockTokenAccountKey,
  getUserTokenAccountKey,
} from "./accounts";

const PROGRAM_UPDATE_AUTHORITY = new PublicKey(
  "MiKELRVWoegdqFHw4R1MH3XvJ8BYFajp89fHZ1fzB5w"
);

export const sendFee = (from: PublicKey): Transaction =>
  new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: from,
      toPubkey: PROGRAM_UPDATE_AUTHORITY,
      lamports: 0.025 * LAMPORTS_PER_SOL,
    })
  );

export const createLock = async (
  user: PublicKey,
  unlockDate: number,
  depositAmount: number,
  mint: PublicKey,
  program: Program<Valhalla>
): Promise<Transaction> =>
  new Transaction()
    .add(
      await program.methods
        .createLock(
          new anchor.BN(Math.floor(unlockDate / 1000)),
          new anchor.BN(depositAmount * LAMPORTS_PER_SOL)
        )
        .accounts({
          user: user,
          lock: getLockKey(user, mint),
          lockTokenAccount: getLockTokenAccountKey(
            getLockKey(user, mint),
            user,
            mint
          ),
          userTokenAccount: getUserTokenAccountKey(mint, user),
          mint,
        })
        .transaction()
    )
    .add(sendFee(user));

export const depositToLock = async (
  user: PublicKey,
  depositAmount: number,
  lock: LockAccount,
  program: Program<Valhalla>
): Promise<Transaction> =>
  new Transaction().add(
    await program.methods
      .depositToLock(
        new anchor.BN((depositAmount * 10 ** lock.mint.decimals).toString())
      )
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

export const withdrawFromLock = async (
  user: PublicKey,
  withdrawAmount: number,
  lock: LockAccount,
  program: Program<Valhalla>
): Promise<Transaction> =>
  new Transaction().add(
    await program.methods
      .withdrawFromLock(
        new anchor.BN((withdrawAmount * 10 ** lock.mint.decimals).toString())
      )
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
        mint: lock.mint.address,
      })
      .transaction()
  );
