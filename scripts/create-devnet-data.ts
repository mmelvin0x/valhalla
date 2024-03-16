import * as anchor from "@coral-xyz/anchor";

import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  Account,
  ExtensionType,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  createInitializeMintInstruction,
  createInitializeTransferFeeConfigInstruction,
  getMintLen,
  getOrCreateAssociatedTokenAccount,
  mintTo,
} from "@solana/spl-token";
import { Authority, getPDAs } from "../tests/utils/utils";
import { Keypair, LAMPORTS_PER_SOL, SystemProgram } from "@solana/web3.js";

import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import { PublicKey } from "@metaplex-foundation/js";
import { Valhalla } from "../target/types/valhalla";
import fs from "fs";

const provider = anchor.AnchorProvider.env();
const connection = provider.connection;
const wallet = NodeWallet.local();
anchor.setProvider(provider);

const program = anchor.workspace.Valhalla as anchor.Program<Valhalla>;

const getNameArg = (name: string): number[] => {
  const nameArg = [];
  const name_ = anchor.utils.bytes.utf8.encode(name);
  name_.forEach((byte, i) => {
    if (i < 32) {
      nameArg.push(byte);
    }
  });

  // make the nameArg 32 bytes
  if (nameArg.length < 32) {
    const diff = 32 - nameArg.length;
    for (let i = 0; i < diff; i++) {
      nameArg.push(0);
    }
  }

  return nameArg;
};

const airdrop = async (reciever: PublicKey) => {
  await connection.confirmTransaction(
    await connection.requestAirdrop(reciever, 2 * LAMPORTS_PER_SOL),
    "confirmed"
  );
};

const createScheduledPayment = async (
  creator: Keypair,
  receipient: Keypair,
  mint: PublicKey,
  creatorTokenAccount: Account,
  tokenProgram: PublicKey
) => {
  const pdas = getPDAs(
    program.programId,
    creator.publicKey,
    receipient.publicKey,
    mint
  );
  const amountToBeVested = new anchor.BN(1_000_000);
  const vestingDuration = new anchor.BN(60 * 60 * 24);
  const cancelAuthority = new anchor.BN(Authority.Both);
  const changeRecipientAuthority = new anchor.BN(Authority.Both);
  const name = getNameArg(
    `Scheduled Payment ${
      tokenProgram === TOKEN_PROGRAM_ID ? "SPL" : "Token 2022"
    }`
  );
  const recipientTokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    wallet.payer,
    mint,
    receipient.publicKey,
    false,
    undefined,
    undefined,
    tokenProgram
  );

  try {
    const tx = await program.methods
      .createScheduledPayment(
        amountToBeVested,
        vestingDuration,
        program.coder.types.decode("Authority", cancelAuthority.toBuffer()),
        program.coder.types.decode(
          "Authority",
          changeRecipientAuthority.toBuffer()
        ),
        name
      )
      .accounts({
        creator: creator.publicKey,
        recipient: receipient.publicKey,
        config: pdas.config,
        treasury: wallet.publicKey,
        scheduledPayment: pdas.scheduledPayment,
        scheduledPaymentTokenAccount: pdas.scheduledPaymentTokenAccount,
        creatorTokenAccount: creatorTokenAccount.address,
        recipientTokenAccount: recipientTokenAccount.address,
        mint,
        tokenProgram,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      })
      .transaction();

    await provider.sendAndConfirm(tx, [creator]);
  } catch (e) {
    console.log(e);
  }
};

const createTokenLock = async (
  creator: Keypair,
  receipient: Keypair,
  mint: PublicKey,
  creatorTokenAccount: Account,
  tokenProgram: PublicKey
) => {
  const pdas = getPDAs(
    program.programId,
    creator.publicKey,
    receipient.publicKey,
    mint
  );
  const amountToBeVested = new anchor.BN(1_000_000);
  const vestingDuration = new anchor.BN(60 * 60 * 24);
  const name = getNameArg(
    `Token Lock ${tokenProgram === TOKEN_PROGRAM_ID ? "SPL" : "Token 2022"}`
  );

  try {
    const tx = await program.methods
      .createTokenLock(amountToBeVested, vestingDuration, name)
      .accounts({
        creator: creator.publicKey,
        config: pdas.config,
        treasury: wallet.publicKey,
        tokenLock: pdas.tokenLock,
        tokenLockTokenAccount: pdas.tokenLockTokenAccount,
        creatorTokenAccount: creatorTokenAccount.address,
        mint,
        tokenProgram,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      })
      .transaction();

    await provider.sendAndConfirm(tx, [creator]);
  } catch (e) {
    console.log(e);
  }
};

const createVestingSchedule = async (
  creator: Keypair,
  receipient: Keypair,
  mint: PublicKey,
  tokenAccount: Account,
  tokenProgram: PublicKey
) => {
  const pdas = getPDAs(
    program.programId,
    creator.publicKey,
    receipient.publicKey,
    mint
  );
  const amountToBeVested = new anchor.BN(1_000_000);
  const vestingDuration = new anchor.BN(60 * 60 * 24);
  const payoutInterval = new anchor.BN(60 * 60);
  const cliffPaymentAmount = new anchor.BN(500_000);
  const cancelAuthority = new anchor.BN(Authority.Both);
  const changeRecipientAuthority = new anchor.BN(Authority.Both);
  const name = getNameArg(
    `Vesting Schedule ${
      tokenProgram === TOKEN_PROGRAM_ID ? "SPL" : "Token 2022"
    }`
  );
  const startDate = new anchor.BN(Date.now() / 1000);
  const recipientTokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    wallet.payer,
    mint,
    receipient.publicKey,
    false,
    undefined,
    undefined,
    tokenProgram
  );

  try {
    const tx = await program.methods
      .createVestingSchedule(
        amountToBeVested,
        vestingDuration,
        payoutInterval,
        cliffPaymentAmount,
        startDate,
        program.coder.types.decode("Authority", cancelAuthority.toBuffer()),
        program.coder.types.decode(
          "Authority",
          changeRecipientAuthority.toBuffer()
        ),
        name
      )
      .accounts({
        creator: creator.publicKey,
        recipient: receipient.publicKey,
        config: pdas.config,
        treasury: wallet.publicKey,
        vestingSchedule: pdas.vestingSchedule,
        vestingScheduleTokenAccount: pdas.vestingScheduleTokenAccount,
        creatorTokenAccount: tokenAccount.address,
        recipientTokenAccount: recipientTokenAccount.address,
        mint,
        tokenProgram,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      })
      .transaction();

    await provider.sendAndConfirm(tx, [creator]);
  } catch (e) {
    console.log(e);
  }
};

const mintSplTokens = async (
  payer: Keypair
): Promise<{ splMint: PublicKey; splTokenAccount: Account }> => {
  console.log("Minting SPL Tokens");
  const splMintKeypair = anchor.web3.Keypair.generate();
  const splMint = splMintKeypair.publicKey;
  const splMintLen = getMintLen([]);
  const splMintLamports = await connection.getMinimumBalanceForRentExemption(
    splMintLen
  );

  const splMintTx = new anchor.web3.Transaction().add(
    SystemProgram.createAccount({
      fromPubkey: wallet.publicKey,
      newAccountPubkey: splMint,
      space: splMintLen,
      lamports: splMintLamports,
      programId: TOKEN_PROGRAM_ID,
    }),
    createInitializeMintInstruction(
      splMint,
      9,
      wallet.publicKey,
      null,
      TOKEN_PROGRAM_ID
    )
  );

  const splSig = await connection.sendTransaction(splMintTx, [
    wallet.payer,
    splMintKeypair,
  ]);
  await connection.confirmTransaction(splSig);

  const splTokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    payer,
    splMint,
    payer.publicKey,
    false,
    undefined,
    undefined,
    TOKEN_PROGRAM_ID
  );

  await mintTo(
    connection,
    payer,
    splMint,
    splTokenAccount.address,
    wallet.payer,
    1_000_000_000 * LAMPORTS_PER_SOL,
    [],
    undefined,
    TOKEN_PROGRAM_ID
  );

  return {
    splMint,
    splTokenAccount,
  };
};

const mintToken2022Tokens = async (
  payer: Keypair
): Promise<{ token2022Mint: PublicKey; token2022TokenAccount: Account }> => {
  console.log("Minting Token 2022 Tokens");
  const token2022MintKeypair = anchor.web3.Keypair.generate();
  const token2022Mint = token2022MintKeypair.publicKey;
  const token2022MintLen = getMintLen([ExtensionType.TransferFeeConfig]);
  const token2022MintLamports =
    await connection.getMinimumBalanceForRentExemption(token2022MintLen);

  const token2022MintTx = new anchor.web3.Transaction().add(
    SystemProgram.createAccount({
      fromPubkey: wallet.publicKey,
      newAccountPubkey: token2022Mint,
      space: token2022MintLen,
      lamports: token2022MintLamports,
      programId: TOKEN_2022_PROGRAM_ID,
    }),
    createInitializeTransferFeeConfigInstruction(
      token2022Mint,
      wallet.publicKey,
      wallet.publicKey,
      100,
      BigInt(10_000),
      TOKEN_2022_PROGRAM_ID
    ),
    createInitializeMintInstruction(
      token2022Mint,
      9,
      wallet.publicKey,
      null,
      TOKEN_2022_PROGRAM_ID
    )
  );

  const token2022Sig = await connection.sendTransaction(token2022MintTx, [
    wallet.payer,
    token2022MintKeypair,
  ]);
  await connection.confirmTransaction(token2022Sig);

  const token2022TokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    payer,
    token2022Mint,
    payer.publicKey,
    false,
    undefined,
    undefined,
    TOKEN_2022_PROGRAM_ID
  );

  await mintTo(
    connection,
    payer,
    token2022Mint,
    token2022TokenAccount.address,
    wallet.payer,
    1_000_000_000 * LAMPORTS_PER_SOL,
    [],
    undefined,
    TOKEN_2022_PROGRAM_ID
  );

  return {
    token2022Mint,
    token2022TokenAccount,
  };
};

async function main(
  creatorKeypairPath = "creator.json",
  recipientKeypairPath = "recipient.json"
) {
  const creator = Keypair.fromSecretKey(
    new Uint8Array(JSON.parse(fs.readFileSync(creatorKeypairPath, "utf-8")))
  );
  const recipient = Keypair.fromSecretKey(
    new Uint8Array(JSON.parse(fs.readFileSync(recipientKeypairPath, "utf-8")))
  );

  try {
    console.log("Airdropping SOL");
    await airdrop(creator.publicKey);
    await airdrop(recipient.publicKey);
  } catch (e) {
    console.log("Airdrop failed, continuing...");
  }

  // Mint SPL Tokens
  const { splMint, splTokenAccount } = await mintSplTokens(creator);

  // Mint token 2022 tokens
  const { token2022Mint, token2022TokenAccount } = await mintToken2022Tokens(
    creator
  );

  // Create spl vesting schedule
  console.log("Creating SPL Vesting Schedule");
  await createVestingSchedule(
    creator,
    recipient,
    splMint,
    splTokenAccount,
    TOKEN_PROGRAM_ID
  );
  // Create token 2022 vesting schedule
  console.log("Creating Token 2022 Vesting Schedule");
  await createVestingSchedule(
    creator,
    recipient,
    token2022Mint,
    token2022TokenAccount,
    TOKEN_2022_PROGRAM_ID
  );

  // Create spl token lock
  console.log("Creating SPL Token Lock");
  await createTokenLock(
    creator,
    recipient,
    splMint,
    splTokenAccount,
    TOKEN_PROGRAM_ID
  );
  // Create token 2022 token lock
  console.log("Creating Token 2022 Token Lock");
  await createTokenLock(
    creator,
    recipient,
    token2022Mint,
    token2022TokenAccount,
    TOKEN_2022_PROGRAM_ID
  );

  // Create spl scheduled payment
  console.log("Creating SPL Scheduled Payment");
  await createScheduledPayment(
    creator,
    recipient,
    splMint,
    splTokenAccount,
    TOKEN_PROGRAM_ID
  );
  // Create token 2022 scheduled payment
  console.log("Creating Token 2022 Scheduled Payment");
  await createScheduledPayment(
    creator,
    recipient,
    token2022Mint,
    token2022TokenAccount,
    TOKEN_2022_PROGRAM_ID
  );
}

main(".keys/creator.json", ".keys/recipient.json").then(
  () =>
    main(".keys/recipient.json", ".keys/creator.json").then(
      () => process.exit(0),
      (err) => {
        console.error(err);
        process.exit(-1);
      }
    ),
  (err) => {
    console.error(err);
    process.exit(-1);
  }
);
