import * as anchor from "@coral-xyz/anchor";

import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  ExtensionType,
  TOKEN_2022_PROGRAM_ID,
  createInitializeMintInstruction,
  createInitializeTransferFeeConfigInstruction,
  createMint,
  getMintLen,
  getOrCreateAssociatedTokenAccount,
  mintTo,
} from "@solana/spl-token";
import {
  Keypair,
  LAMPORTS_PER_SOL,
  SystemProgram,
  Transaction,
  clusterApiUrl,
} from "@solana/web3.js";

const receiverOne = new anchor.web3.PublicKey(
  "J7eKcBfEkVpt5iGGTGL7oXX9RcSBR7vGihkSisjpbyoB"
);

const receiverTwo = new anchor.web3.PublicKey(
  "GQg22KPsLhEysUHsKdz4RxEW5oWTFQa4A7oQgvsSP6x6"
);

async function mintToken2022Tokens() {
  const wallet = anchor.Wallet.local();
  const connection = new anchor.web3.Connection(
    clusterApiUrl("devnet"),
    "confirmed"
  );
  const mintKeypair = Keypair.generate();
  const mint = mintKeypair.publicKey;
  const mintLen = getMintLen([ExtensionType.TransferFeeConfig]);
  const mintLamports = await connection.getMinimumBalanceForRentExemption(
    mintLen
  );

  const mintTx = new Transaction().add(
    SystemProgram.createAccount({
      fromPubkey: wallet.publicKey,
      newAccountPubkey: mint,
      space: mintLen,
      lamports: mintLamports,
      programId: TOKEN_2022_PROGRAM_ID,
    }),
    createInitializeTransferFeeConfigInstruction(
      mint,
      wallet.publicKey,
      wallet.publicKey,
      100,
      BigInt(10_000),
      TOKEN_2022_PROGRAM_ID
    ),
    createInitializeMintInstruction(
      mint,
      9,
      wallet.publicKey,
      null,
      TOKEN_2022_PROGRAM_ID
    )
  );

  const tx = await connection.sendTransaction(mintTx, [
    wallet.payer,
    mintKeypair,
  ]);
  await connection.confirmTransaction(tx, "confirmed");

  const receiverOneTokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    wallet.payer,
    mint,
    receiverOne,
    false,
    undefined,
    undefined,
    TOKEN_2022_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );

  const receiverTwoTokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    wallet.payer,
    mint,
    receiverTwo,
    false,
    undefined,
    undefined,
    TOKEN_2022_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );

  console.log("Minting Token2022 tokens to Receiver One...");
  await mintTo(
    connection,
    wallet.payer,
    mint,
    receiverOneTokenAccount.address,
    wallet.payer,
    1_000_000_000 * LAMPORTS_PER_SOL,
    [],
    undefined,
    TOKEN_2022_PROGRAM_ID
  );

  console.log("Minting Token2022 tokens to Receiver Two...");
  await mintTo(
    connection,
    wallet.payer,
    mint,
    receiverTwoTokenAccount.address,
    wallet.payer,
    1_000_000_000 * LAMPORTS_PER_SOL,
    [],
    undefined,
    TOKEN_2022_PROGRAM_ID
  );
}

async function mintSPLTokens() {
  const wallet = anchor.Wallet.local();
  const connection = new anchor.web3.Connection(
    clusterApiUrl("devnet"),
    "confirmed"
  );

  await connection.confirmTransaction(
    await connection.requestAirdrop(wallet.publicKey, LAMPORTS_PER_SOL),
    "confirmed"
  );

  const mint = await createMint(
    connection,
    wallet.payer,
    wallet.publicKey,
    wallet.publicKey,
    9
  );

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

  await mintTo(
    connection,
    wallet.payer,
    mint,
    receiverOneTokenAccount.address,
    wallet.publicKey,
    1_000_000_000 * LAMPORTS_PER_SOL
  );

  mintTo(
    connection,
    wallet.payer,
    mint,
    receiverTwoTokenAccount.address,
    wallet.publicKey,
    1_000_000_000 * LAMPORTS_PER_SOL
  );
}

async function main() {
  await mintToken2022Tokens();
  await mintSPLTokens();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
