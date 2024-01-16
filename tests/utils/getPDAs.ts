import { PublicKey } from "@solana/web3.js";

export const LOCK_SEED = Buffer.from("lock");
export const LOCKER_SEED = Buffer.from("locker");
export const LOCK_TOKEN_ACCOUNT_SEED = Buffer.from("token");

export function getPDAs(
  programId: PublicKey,
  funder: PublicKey,
  recipient: PublicKey,
  mint: PublicKey
): [PublicKey, PublicKey, PublicKey] {
  const [locker] = PublicKey.findProgramAddressSync([LOCKER_SEED], programId);
  const [lock] = PublicKey.findProgramAddressSync(
    [funder.toBuffer(), recipient.toBuffer(), mint.toBuffer(), LOCK_SEED],
    programId
  );
  const [lockTokenAccount] = PublicKey.findProgramAddressSync(
    [lock.toBuffer(), LOCK_TOKEN_ACCOUNT_SEED],
    programId
  );

  return [locker, lock, lockTokenAccount];
}
