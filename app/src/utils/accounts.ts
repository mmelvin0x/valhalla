import { getAccount, getAssociatedTokenAddressSync } from "@solana/spl-token";
import { Connection, PublicKey } from "@solana/web3.js";
import { PROGRAM_ID } from "program";

const USDCMint = new PublicKey("E6Z6y6j9UWnafvgU4h2Dwz6VFM7hc4HAEj5R3WRTg9Js");
const USDTMint = new PublicKey("BQcdHdZb9jNcYmMWTWFzdJjB7BzmzVjCpAH7F1KJFGe1");
const BONKMint = new PublicKey("DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263");

const USDCAccount = async (connection: Connection) => {
  return await getAccount(connection, USDCMint);
};

const USDTAccount = async (connection: Connection) => {
  return await getAccount(connection, USDTMint);
};

const BONKAccount = async (connection: Connection) => {
  return await getAccount(connection, BONKMint);
};

export const LOCKER_SEED = "locker";
export const LOCK_SEED = "lock";
export const LOCK_TOKEN_ACCOUNT_SEED = "token";

export const TREASURY_KEY = new PublicKey(
  "MiKELRVWoegdqFHw4R1MH3XvJ8BYFajp89fHZ1fzB5w"
);

export const [LOCKER_KEY] = PublicKey.findProgramAddressSync(
  [Buffer.from("locker")],
  PROGRAM_ID
);

export const getLockKey = (
  lockerKey: PublicKey,
  userKey: PublicKey,
  tokenMint: PublicKey
) =>
  PublicKey.findProgramAddressSync(
    [
      lockerKey.toBuffer(),
      userKey.toBuffer(),
      tokenMint.toBuffer(),
      Buffer.from(LOCK_SEED),
    ],
    PROGRAM_ID
  )[0];

export const getLockTokenAccountKey = (
  lockKey: PublicKey,
  userKey: PublicKey,
  tokenMint: PublicKey
) =>
  PublicKey.findProgramAddressSync(
    [
      lockKey.toBuffer(),
      userKey.toBuffer(),
      tokenMint.toBuffer(),
      Buffer.from(LOCK_TOKEN_ACCOUNT_SEED),
    ],
    PROGRAM_ID
  )[0];

export const getUserTokenAccountKey = (
  tokenMint: PublicKey,
  userKey: PublicKey
) => {
  return getAssociatedTokenAddressSync(tokenMint, userKey);
};
