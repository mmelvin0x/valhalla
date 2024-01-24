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
import { Authority, getPDAs } from "../tests/utils/constants";
import { LAMPORTS_PER_SOL, SystemProgram } from "@solana/web3.js";

import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import { PublicKey } from "@metaplex-foundation/js";
import { Valhalla } from "../target/types/valhalla";

const receipient = new anchor.web3.PublicKey(
  "4TJHcKqgeMD7kjQ1Xub4xHmAGHfpdQjcW7AgRPtKfY5W"
);

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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

const provider = anchor.AnchorProvider.env();
const connection = provider.connection;
const wallet = NodeWallet.local();
anchor.setProvider(provider);

const program = anchor.workspace.Valhalla as anchor.Program<Valhalla>;

async function createTestData() {
  // TODO: mint token 2022 tokens and regular spl tokens
  // TODO: create vesting schedules with all possible cases covered
  // TODO: create token locks with all possible cases covered
  // TODO: create scheduled payments with all possible cases covered

  // Mint token 2022 tokens
  const splMintKeypair = anchor.web3.Keypair.generate();
  const splMint = splMintKeypair.publicKey;
  const splMintLen = getMintLen([ExtensionType.TransferFeeConfig]);
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
    createInitializeTransferFeeConfigInstruction(
      splMint,
      wallet.publicKey,
      wallet.publicKey,
      100,
      BigInt(10_000),
      TOKEN_PROGRAM_ID
    ),
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
    wallet.payer,
    splMint,
    wallet.publicKey,
    false,
    undefined,
    undefined,
    TOKEN_PROGRAM_ID
  );

  await mintTo(
    connection,
    wallet.payer,
    splMint,
    splTokenAccount.address,
    wallet.payer,
    1_000_000_000 * LAMPORTS_PER_SOL,
    [],
    undefined,
    TOKEN_PROGRAM_ID
  );

  // Mint token 2022 tokens
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
    wallet.payer,
    token2022Mint,
    wallet.publicKey,
    false,
    undefined,
    undefined,
    TOKEN_PROGRAM_ID
  );

  await mintTo(
    connection,
    wallet.payer,
    token2022Mint,
    token2022TokenAccount.address,
    wallet.payer,
    1_000_000_000 * LAMPORTS_PER_SOL,
    [],
    undefined,
    TOKEN_PROGRAM_ID
  );

  // Create spl vesting schedules
  for (let i = 0; i < 5; i++) {
    await sleep(1000);
    await createVestingSchedule(splMint, i, splTokenAccount, TOKEN_PROGRAM_ID);
  }

  // Create token 2022 vesting schedules
  for (let i = 0; i < 5; i++) {
    await sleep(1000);
    await createVestingSchedule(
      token2022Mint,
      i,
      token2022TokenAccount,
      TOKEN_2022_PROGRAM_ID
    );
  }
}

const createVestingSchedule = async (
  mint: PublicKey,
  index: number,
  tokenAccount: Account,
  tokenProgram: PublicKey
) => {
  let pdas = getPDAs(program.programId, wallet.publicKey, receipient, mint);
  let amountToBeVested = new anchor.BN(1_000_000).mul(new anchor.BN(index + 1));
  let vestingDuration = new anchor.BN(60 * 60 * 24).mul(
    new anchor.BN(index + 1)
  );
  let payoutInterval = new anchor.BN(60 * 60).mul(new anchor.BN(index + 1));
  let cliffPaymentAmount = new anchor.BN(0).mul(new anchor.BN(index + 1));
  let cancelAuthority = new anchor.BN(Authority.Neither);
  let changeRecipientAuthority = new anchor.BN(Authority.Neither);
  let name = getNameArg(`Spl Vesting Schedule ${index}`);
  let startDate = new anchor.BN(Date.now() / 1000);
  let recipientTokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    wallet.payer,
    mint,
    receipient,
    false,
    undefined,
    undefined,
    TOKEN_PROGRAM_ID
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
        creator: wallet.publicKey,
        recipient: receipient,
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

    await provider.sendAndConfirm(tx, [wallet.payer]);
  } catch (e) {
    console.log(e);
  }
};
