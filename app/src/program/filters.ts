import { PublicKey } from "@solana/web3.js";

export const getLocksByUserFilter = (publicKey: PublicKey) => ({
  memcmp: { offset: 8, bytes: publicKey.toBase58() },
});

export const getLocksByMintFilter = (publicKey: PublicKey) => ({
  memcmp: { offset: 40, bytes: publicKey.toBase58() },
});
