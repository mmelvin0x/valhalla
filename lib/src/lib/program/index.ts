import { PublicKey } from "@solana/web3.js";
export * from "./accounts";
export * from "./errors";
export * from "./instructions";
export * from "./types";

/**
 * Program address
 *
 * @category constants
 * @category generated
 */
export const PROGRAM_ADDRESS = "BBczhggWEH5Y5zZNJjgLDWhZhfaSjxm1TcLpYhB79RgY";

/**
 * Program public key
 *
 * @category constants
 * @category generated
 */
export const PROGRAM_ID = new PublicKey(PROGRAM_ADDRESS);
