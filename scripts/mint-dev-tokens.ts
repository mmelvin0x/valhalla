import { clusterApiUrl, LAMPORTS_PER_SOL } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
} from "@solana/spl-token";

const receiverOne = new anchor.web3.PublicKey(
  "AJ7NKueXnNM2sZtBKcf81sMpvyJXENpajLGpdzBKrogJ"
);

const receiverTwo = new anchor.web3.PublicKey(
  "C21fr8jgR8GE3mDfm6gXezkpVDMfPjxfhKsrvJNPcQgA"
);

async function main() {
  const wallet = anchor.Wallet.local();
  const connection = new anchor.web3.Connection(
    clusterApiUrl("devnet"),
    "confirmed"
  );

  console.log("Airdropping SOL to wallet...");
  await connection.confirmTransaction(
    await connection.requestAirdrop(wallet.publicKey, LAMPORTS_PER_SOL),
    "confirmed"
  );

  console.log("Creating mint...");
  const mint = await createMint(
    connection,
    wallet.payer,
    wallet.publicKey,
    wallet.publicKey,
    9
  );

  console.log("Creating token accounts...");
  const receiverOneTokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    wallet.payer,
    mint,
    receiverOne
  );

  const receiverTwoTokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    wallet.payer,
    mint,
    receiverTwo
  );

  console.log("Minting tokens...");
  const sig1 = await mintTo(
    connection,
    wallet.payer,
    mint,
    receiverOneTokenAccount.address,
    wallet.publicKey,
    1_000_000_000 * LAMPORTS_PER_SOL
  );

  const sig2 = await mintTo(
    connection,
    wallet.payer,
    mint,
    receiverTwoTokenAccount.address,
    wallet.publicKey,
    1_000_000_000 * LAMPORTS_PER_SOL
  );

  console.log(sig1, sig2);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
