import * as anchor from "@coral-xyz/anchor";

import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  Account,
  ExtensionType,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  createInitializeMintInstruction,
  createInitializeTransferFeeConfigInstruction,
  createMint,
  getMintLen,
  getOrCreateAssociatedTokenAccount,
  mintTo,
} from "@solana/spl-token";
import {
  Authority,
  confirm,
  getAuthority,
  getName,
  sleep,
} from "../tests/utils/utils";
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";

import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import { Valhalla } from "../target/types/valhalla";
import generate from "project-name-generator";
import { getPDAs } from "../tests/utils/getPDAs";
import one from "../.keys/creator.json";
import { randomBytes } from "crypto";
import two from "../.keys/recipient.json";

const NUM_VAULTS_TO_MAKE = 10;

const second = new anchor.BN(1);
const minute = new anchor.BN(60 * second.toNumber());
const hour = new anchor.BN(60 * minute.toNumber());
const day = new anchor.BN(24 * hour.toNumber());
const week = new anchor.BN(7 * day.toNumber());

async function spl() {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const connection = provider.connection;
  const wallet = provider.wallet as NodeWallet;
  const userOne = Keypair.fromSecretKey(new Uint8Array(one));
  const userTwo = Keypair.fromSecretKey(new Uint8Array(two));
  console.log("User one: ", userOne.publicKey.toBase58());
  console.log("User two: ", userTwo.publicKey.toBase58());

  const program = anchor.workspace.Valhalla as anchor.Program<Valhalla>;

  const { config } = getPDAs(program.programId, new anchor.BN(0));
  const configAccount = await program.account.config.fetch(config);

  const mintUserOne = await mintSplTokens(connection, userOne, 10_000_000);
  const mintUserTwo = await mintSplTokens(connection, userTwo, 10_000_000);

  const userOneAta = await getOrCreateAssociatedTokenAccount(
    connection,
    userOne,
    mintUserOne,
    userOne.publicKey
  );

  const userTwoAta = await getOrCreateAssociatedTokenAccount(
    connection,
    userTwo,
    mintUserTwo,
    userTwo.publicKey
  );

  const daoTreasuryAtaUserOne = await getOrCreateAssociatedTokenAccount(
    provider.connection,
    userOne,
    mintUserOne,
    wallet.publicKey
  );

  const daoTreasuryAtaUserTwo = await getOrCreateAssociatedTokenAccount(
    provider.connection,
    userTwo,
    mintUserTwo,
    wallet.publicKey
  );

  const userOneGovernanceAta = await getOrCreateAssociatedTokenAccount(
    provider.connection,
    userOne,
    configAccount.governanceTokenMintKey,
    userOne.publicKey
  );

  const userTwoGovernanceAta = await getOrCreateAssociatedTokenAccount(
    provider.connection,
    userTwo,
    configAccount.governanceTokenMintKey,
    userTwo.publicKey
  );

  console.log(`Creating SPL vaults...`);
  for (let i = 0; i < NUM_VAULTS_TO_MAKE; i++) {
    const creator = i % 2 === 0 ? userOne : userTwo;
    const recipient = i % 2 === 0 ? userTwo : userOne;
    const creatorAta = i % 2 === 0 ? userOneAta : userTwoAta;
    const daoTreasuryAta =
      i % 2 === 0 ? daoTreasuryAtaUserOne : daoTreasuryAtaUserTwo;
    const mint = i % 2 === 0 ? mintUserOne : mintUserTwo;
    const autopay = i % 3 === 0;
    const creatorGovernanceAta =
      i % 2 === 0 ? userOneGovernanceAta : userTwoGovernanceAta;

    await create(
      connection,
      creator,
      recipient,
      creatorAta,
      creatorGovernanceAta,
      daoTreasuryAta,
      mint,
      configAccount.governanceTokenMintKey,
      autopay,
      i,
      program,
      wallet,
      TOKEN_PROGRAM_ID
    );

    console.log(`Created SPL vault ${i + 1}/${NUM_VAULTS_TO_MAKE}`);
  }
}

async function token2022() {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const connection = provider.connection;
  const wallet = provider.wallet as NodeWallet;
  const userOne = Keypair.fromSecretKey(new Uint8Array(one));
  const userTwo = Keypair.fromSecretKey(new Uint8Array(two));

  const program = anchor.workspace.Valhalla as anchor.Program<Valhalla>;

  const { config } = getPDAs(program.programId, new anchor.BN(0));
  const configAccount = await program.account.config.fetch(config);

  const mintUserOne = await mintToken2022Tokens(
    connection,
    userOne,
    10_000_000
  );
  const mintUserTwo = await mintToken2022Tokens(
    connection,
    userTwo,
    10_000_000
  );

  const userOneAta = await getOrCreateAssociatedTokenAccount(
    connection,
    userOne,
    mintUserOne,
    userOne.publicKey,
    false,
    undefined,
    undefined,
    TOKEN_2022_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );

  const userTwoAta = await getOrCreateAssociatedTokenAccount(
    connection,
    userTwo,
    mintUserTwo,
    userTwo.publicKey,
    false,
    undefined,
    undefined,
    TOKEN_2022_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );

  const daoTreasuryAtaUserOne = await getOrCreateAssociatedTokenAccount(
    provider.connection,
    userOne,
    mintUserOne,
    wallet.publicKey,
    false,
    undefined,
    undefined,
    TOKEN_2022_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );

  const daoTreasuryAtaUserTwo = await getOrCreateAssociatedTokenAccount(
    provider.connection,
    userTwo,
    mintUserTwo,
    wallet.publicKey,
    false,
    undefined,
    undefined,
    TOKEN_2022_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );

  const userOneGovernanceAta = await getOrCreateAssociatedTokenAccount(
    provider.connection,
    userOne,
    configAccount.governanceTokenMintKey,
    userOne.publicKey,
    false,
    undefined,
    undefined,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );

  const userTwoGovernanceAta = await getOrCreateAssociatedTokenAccount(
    provider.connection,
    userTwo,
    configAccount.governanceTokenMintKey,
    userTwo.publicKey,
    false,
    undefined,
    undefined,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );

  console.log(`Creating Token 2022 vaults...`);
  for (let i = 0; i < NUM_VAULTS_TO_MAKE; i++) {
    const creator = i % 2 === 0 ? userOne : userTwo;
    const recipient = i % 2 === 0 ? userTwo : userOne;
    const creatorAta = i % 2 === 0 ? userOneAta : userTwoAta;
    const daoTreasuryAta =
      i % 2 === 0 ? daoTreasuryAtaUserOne : daoTreasuryAtaUserTwo;
    const mint = i % 2 === 0 ? mintUserOne : mintUserTwo;
    const autopay = i % 2 === 0 ? true : false;
    const creatorGovernanceAta =
      i % 2 === 0 ? userOneGovernanceAta : userTwoGovernanceAta;

    await create(
      connection,
      creator,
      recipient,
      creatorAta,
      creatorGovernanceAta,
      daoTreasuryAta,
      mint,
      configAccount.governanceTokenMintKey,
      autopay,
      i,
      program,
      wallet,
      TOKEN_2022_PROGRAM_ID
    );

    console.log(`Created Token 2022 vault ${i + 1}/${NUM_VAULTS_TO_MAKE}`);
  }
}

async function create(
  connection: Connection,
  creator: Keypair,
  recipient: Keypair,
  creatorAta: Account,
  creatorGovernanceAta: Account,
  daoTreasuryAta: Account,
  mint: PublicKey,
  governanceTokenMint: PublicKey,
  autopay: boolean,
  i: number,
  program: anchor.Program<Valhalla>,
  wallet: NodeWallet,
  tokenProgram: PublicKey
) {
  const identifier = new anchor.BN(randomBytes(8));
  const name = getName(generate({ words: 2 }).spaced.toLocaleUpperCase());
  const amountToBeVested = new anchor.BN(10_000_000 / 100);
  const startDate = new anchor.BN(Date.now() / 1000);

  let payoutInterval;
  let totalVestingDuration;
  const intervalNum = getRandomNumberInRange(1, 6);
  switch (intervalNum) {
    case 1:
      payoutInterval = second;
      totalVestingDuration = new anchor.BN(i + 1);
      break;
    case 2:
      payoutInterval = minute;
      totalVestingDuration = new anchor.BN(60 * (i + 1));
      break;
    case 3:
      payoutInterval = hour;
      totalVestingDuration = new anchor.BN(60 * 60 * (i + 1));
      break;
    case 4:
      payoutInterval = day;
      totalVestingDuration = new anchor.BN(24 * 60 * 60 * (i + 1));
      break;
    case 5:
      payoutInterval = week;
      totalVestingDuration = new anchor.BN(7 * 24 * 60 * 60 * (i + 1));
      break;
    default:
      payoutInterval = day;
      totalVestingDuration = new anchor.BN(24 * 60 * 60 * (i + 1));
  }

  let cancelAuthority;
  const cancelNum = getRandomNumberInRange(1, 5);
  switch (cancelNum) {
    case 1:
      cancelAuthority = getAuthority(Authority.Neither, program);
      break;
    case 2:
      cancelAuthority = getAuthority(Authority.Creator, program);
      break;
    case 3:
      cancelAuthority = getAuthority(Authority.Recipient, program);
      break;
    case 5:
      cancelAuthority = getAuthority(Authority.Both, program);
      break;
    default:
      cancelAuthority = getAuthority(Authority.Neither, program);
  }

  const pdas = getPDAs(program.programId, identifier, creator.publicKey, mint);

  const tx = await program.methods
    .create(
      identifier,
      name,
      amountToBeVested,
      totalVestingDuration,
      startDate,
      payoutInterval,
      cancelAuthority,
      autopay
    )
    .accounts({
      creator: creator.publicKey,
      recipient: recipient.publicKey,
      devTreasury: wallet.publicKey,
      daoTreasury: wallet.publicKey,
      config: pdas.config,
      vault: pdas.vault,
      vaultAta: pdas.vaultAta,
      daoTreasuryAta: daoTreasuryAta.address,
      creatorAta: creatorAta.address,
      creatorGovernanceAta: creatorGovernanceAta.address,
      mint,
      governanceTokenMint,
      governanceTokenProgram: TOKEN_PROGRAM_ID,
      tokenProgram,
      systemProgram: SystemProgram.programId,
    })
    .signers([creator])
    .rpc();

  await confirm(connection, tx);
  await sleep(5000);
}

function getRandomNumberInRange(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

async function mintSplTokens(
  connection: Connection,
  user: Keypair,
  amount: number
): Promise<PublicKey> {
  const mint = await createMint(
    connection,
    user,
    user.publicKey,
    user.publicKey,
    9
  );

  const userTokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    user,
    mint,
    user.publicKey
  );

  await mintTo(
    connection,
    user,
    mint,
    userTokenAccount.address,
    user,
    amount * LAMPORTS_PER_SOL
  );

  return mint;
}

async function mintToken2022Tokens(
  connection: Connection,
  user: Keypair,
  amount: number
): Promise<PublicKey> {
  const mintKeypair = Keypair.generate();
  const mint = mintKeypair.publicKey;
  const mintLen = getMintLen([ExtensionType.TransferFeeConfig]);
  const mintLamports = await connection.getMinimumBalanceForRentExemption(
    mintLen
  );

  const tx = new Transaction().add(
    SystemProgram.createAccount({
      fromPubkey: user.publicKey,
      newAccountPubkey: mint,
      space: mintLen,
      lamports: mintLamports,
      programId: TOKEN_2022_PROGRAM_ID,
    }),
    createInitializeTransferFeeConfigInstruction(
      mint,
      user.publicKey,
      user.publicKey,
      100,
      BigInt(10_000),
      TOKEN_2022_PROGRAM_ID
    ),
    createInitializeMintInstruction(
      mint,
      9,
      user.publicKey,
      null,
      TOKEN_2022_PROGRAM_ID
    )
  );

  const sig = await connection.sendTransaction(tx, [user, mintKeypair]);
  await connection.confirmTransaction(sig, "confirmed");

  const userTokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    user,
    mint,
    user.publicKey,
    false,
    undefined,
    undefined,
    TOKEN_2022_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );

  await mintTo(
    connection,
    user,
    mint,
    userTokenAccount.address,
    user,
    amount * LAMPORTS_PER_SOL,
    [],
    undefined,
    TOKEN_2022_PROGRAM_ID
  );

  return mint;
}

spl();

token2022();
