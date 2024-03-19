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
import { getPDAs } from "../tests/utils/getPDAs";
import one from "../.keys/creator.json";
import { randomBytes } from "crypto";
import two from "../.keys/recipient.json";

const NUM_VAULTS_TO_MAKE = 15;

const second = new anchor.BN(60);
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

  const program = anchor.workspace.Valhalla as anchor.Program<Valhalla>;
  const config = (await program.account.config.all())[0];

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

  const userOneGovernanceAta = await getOrCreateAssociatedTokenAccount(
    connection,
    userOne,
    config.account.governanceTokenMintKey,
    userOne.publicKey
  );

  const userTwoGovernanceAta = await getOrCreateAssociatedTokenAccount(
    connection,
    userTwo,
    config.account.governanceTokenMintKey,
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

  for (let i = 0; i < NUM_VAULTS_TO_MAKE; i++) {
    console.log(`Creating vault ${i}`);
    const creator = i % 2 === 0 ? userOne : userTwo;
    const recipient = i % 2 === 0 ? userTwo : userOne;
    const creatorAta = i % 2 === 0 ? userOneAta : userTwoAta;
    const daoTreasuryAta =
      i % 2 === 0 ? daoTreasuryAtaUserOne : daoTreasuryAtaUserTwo;
    const creatorGovernanceAta =
      i % 2 === 0 ? userOneGovernanceAta : userTwoGovernanceAta;
    const mint = i % 2 === 0 ? mintUserOne : mintUserTwo;
    const autopay = i % 3 === 0 ? true : false;

    await create(
      connection,
      creator,
      recipient,
      creatorAta,
      daoTreasuryAta,
      creatorGovernanceAta,
      mint,
      autopay,
      i,
      program,
      wallet,
      config,
      TOKEN_PROGRAM_ID
    );
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
  const config = (await program.account.config.all())[0];

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

  const userOneGovernanceAta = await getOrCreateAssociatedTokenAccount(
    connection,
    userOne,
    config.account.governanceTokenMintKey,
    userOne.publicKey
  );

  const userTwoGovernanceAta = await getOrCreateAssociatedTokenAccount(
    connection,
    userTwo,
    config.account.governanceTokenMintKey,
    userTwo.publicKey
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

  for (let i = 0; i < NUM_VAULTS_TO_MAKE; i++) {
    const creator = i % 2 === 0 ? userOne : userTwo;
    const recipient = i % 2 === 0 ? userTwo : userOne;
    const creatorAta = i % 2 === 0 ? userOneAta : userTwoAta;
    const daoTreasuryAta =
      i % 2 === 0 ? daoTreasuryAtaUserOne : daoTreasuryAtaUserTwo;
    const creatorGovernanceAta =
      i % 2 === 0 ? userOneGovernanceAta : userTwoGovernanceAta;
    const mint = i % 2 === 0 ? mintUserOne : mintUserTwo;
    const autopay = i % 3 === 0 ? true : false;

    await create(
      connection,
      creator,
      recipient,
      creatorAta,
      daoTreasuryAta,
      creatorGovernanceAta,
      mint,
      autopay,
      i,
      program,
      wallet,
      config,
      TOKEN_2022_PROGRAM_ID
    );
  }
}

async function create(
  connection: Connection,
  creator: Keypair,
  recipient: Keypair,
  creatorAta: Account,
  daoTreasuryAta: Account,
  creatorGovernanceAta: Account,
  mint: PublicKey,
  autopay: boolean,
  i: number,
  program: anchor.Program<Valhalla>,
  wallet: NodeWallet,
  config: any,
  tokenProgram: PublicKey
) {
  const identifier = new anchor.BN(randomBytes(8));
  const name = getName(`Vault ${i}`);
  const amountToBeVested = new anchor.BN(10_000_000 / 100);
  const totalVestingDuration = new anchor.BN(60 * 60 * (i + 1));
  const startDate = new anchor.BN(Date.now() / 1000);

  let payoutInterval;
  const intervalNum = getRandomNumberInRange(1, 6);
  switch (intervalNum) {
    case 1:
      payoutInterval = second;
      break;
    case 2:
      payoutInterval = minute;
      break;
    case 3:
      payoutInterval = hour;
      break;
    case 4:
      payoutInterval = day;
      break;
    case 5:
      payoutInterval = week;
      break;
    default:
      payoutInterval = day;
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
      governanceTokenMint: config.account.governanceTokenMintKey,
      mint,
      tokenProgram,
      governanceTokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    })
    .signers([creator])
    .rpc();

  await confirm(connection, tx);
  await sleep(2500);
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
