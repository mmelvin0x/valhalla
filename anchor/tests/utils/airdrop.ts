import { Connection, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";

export async function airdrop(
  connection: Connection,
  address: PublicKey,
  lamports: number = 2 * LAMPORTS_PER_SOL
) {
  await connection.confirmTransaction(
    await connection.requestAirdrop(address, lamports),
    "confirmed"
  );
}
