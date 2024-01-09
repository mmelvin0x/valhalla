import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Valhalla } from "../target/types/valhalla";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import {
  Keypair,
  LAMPORTS_PER_SOL,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  ExtensionType,
  TOKEN_2022_PROGRAM_ID,
  TokenAccountNotFoundError,
  createAccount,
  createInitializeMintInstruction,
  createInitializeTransferFeeConfigInstruction,
  getAccount,
  getMintLen,
  mintTo,
} from "@solana/spl-token";
import { expect } from "chai";

const LOCK_SEED = Buffer.from("lock");
const LOCKER_SEED = Buffer.from("locker");
const LOCK_TOKEN_ACCOUNT_SEED = Buffer.from("token");

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const getFee = (
  transferAmount: anchor.BN,
  feeBasisPoints: number,
  maxFee: BigInt
): number => {
  let feeTaken =
    (transferAmount.toNumber() * LAMPORTS_PER_SOL * feeBasisPoints) / 10000;
  if (feeTaken > Number(maxFee)) {
    feeTaken = Number(maxFee);
  }

  return feeTaken;
};

describe("Valhalla", () => {
  const provider = anchor.AnchorProvider.env();
  const wallet = provider.wallet as NodeWallet;
  const payer = (wallet as NodeWallet).payer;
  anchor.setProvider(provider);

  const program = anchor.workspace.Valhalla as Program<Valhalla>;

  const creator = anchor.web3.Keypair.generate();
  const beneficiary = anchor.web3.Keypair.generate();

  const mintAuthority = payer;
  const transferFeeConfigAuthority = payer;
  const withdrawWithheldAuthority = payer;
  const mintKeypair = Keypair.generate();
  const mint = mintKeypair.publicKey;

  const extensions = [ExtensionType.TransferFeeConfig];

  const mintLen = getMintLen(extensions);
  const decimals = 9;
  const feeBasisPoints = 50;
  const maxFee = BigInt(5_000 * LAMPORTS_PER_SOL);

  let creatorTokenAccount: anchor.web3.PublicKey;
  let beneficiaryTokenAccount: anchor.web3.PublicKey;
  let lock: anchor.web3.PublicKey;
  let locker: anchor.web3.PublicKey;
  let lockTokenAccount: anchor.web3.PublicKey;

  before(async () => {
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(
        creator.publicKey,
        2 * LAMPORTS_PER_SOL
      ),
      "confirmed"
    );

    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(
        beneficiary.publicKey,
        2 * LAMPORTS_PER_SOL
      ),
      "confirmed"
    );

    const mintLamports =
      await provider.connection.getMinimumBalanceForRentExemption(mintLen);
    const mintTransaction = new Transaction().add(
      SystemProgram.createAccount({
        fromPubkey: payer.publicKey,
        newAccountPubkey: mint,
        space: mintLen,
        lamports: mintLamports,
        programId: TOKEN_2022_PROGRAM_ID,
      }),
      createInitializeTransferFeeConfigInstruction(
        mint,
        transferFeeConfigAuthority.publicKey,
        withdrawWithheldAuthority.publicKey,
        feeBasisPoints,
        maxFee,
        TOKEN_2022_PROGRAM_ID
      ),
      createInitializeMintInstruction(
        mint,
        decimals,
        mintAuthority.publicKey,
        null,
        TOKEN_2022_PROGRAM_ID
      )
    );

    await provider.sendAndConfirm(mintTransaction, [payer, mintKeypair]);

    creatorTokenAccount = await createAccount(
      provider.connection,
      creator,
      mint,
      creator.publicKey,
      undefined,
      undefined,
      TOKEN_2022_PROGRAM_ID
    );

    beneficiaryTokenAccount = await createAccount(
      provider.connection,
      beneficiary,
      mint,
      beneficiary.publicKey,
      undefined,
      undefined,
      TOKEN_2022_PROGRAM_ID
    );

    await mintTo(
      provider.connection,
      payer,
      mint,
      creatorTokenAccount,
      mintAuthority,
      10_000_000_000 * LAMPORTS_PER_SOL,
      [],
      undefined,
      TOKEN_2022_PROGRAM_ID
    );

    [locker] = anchor.web3.PublicKey.findProgramAddressSync(
      [LOCKER_SEED],
      program.programId
    );

    [lock] = anchor.web3.PublicKey.findProgramAddressSync(
      [creator.publicKey.toBuffer(), mint.toBuffer(), LOCK_SEED],
      program.programId
    );

    [lockTokenAccount] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        lock.toBuffer(),
        creator.publicKey.toBuffer(),
        mint.toBuffer(),
        LOCK_TOKEN_ACCOUNT_SEED,
      ],
      program.programId
    );
  });

  ///////////////////////////////////////////
  // Admin Operations
  ///////////////////////////////////////////
  it("should initialize the locker", async () => {
    const tx = await program.methods
      .adminInitLocker(new anchor.BN(0.1 * LAMPORTS_PER_SOL))
      .accounts({
        admin: wallet.publicKey,
        locker,
        treasury: wallet.publicKey,
      })
      .signers([(wallet as NodeWallet).payer])
      .rpc();

    await provider.connection.confirmTransaction(tx, "confirmed");

    const lockerAccount = await program.account.locker.fetch(locker);
    expect(lockerAccount.fee.toNumber()).equals(0.1 * LAMPORTS_PER_SOL);
    expect(lockerAccount.admin.toBase58()).equals(wallet.publicKey.toBase58());
    expect(lockerAccount.treasury.toBase58()).equals(
      wallet.publicKey.toBase58()
    );
  });

  it("should update the locker fee", async () => {
    let lockerAccount = await program.account.locker.fetch(locker);

    let tx = await program.methods
      .adminUpdateLockerFee(new anchor.BN(0.2 * LAMPORTS_PER_SOL))
      .accounts({
        admin: wallet.publicKey,
        locker,
        treasury: wallet.publicKey,
      })
      .signers([(wallet as NodeWallet).payer])
      .rpc();

    await provider.connection.confirmTransaction(tx, "confirmed");

    lockerAccount = await program.account.locker.fetch(locker);
    expect(lockerAccount.fee.toNumber()).equals(0.2 * LAMPORTS_PER_SOL);

    tx = await program.methods
      .adminUpdateLockerFee(new anchor.BN(0.1 * LAMPORTS_PER_SOL))
      .accounts({
        treasury: wallet.publicKey,
        admin: wallet.publicKey,
        locker,
      })
      .signers([(wallet as NodeWallet).payer])
      .rpc();

    await provider.connection.confirmTransaction(tx, "confirmed");

    lockerAccount = await program.account.locker.fetch(locker);
    expect(lockerAccount.fee.toNumber()).equals(0.1 * LAMPORTS_PER_SOL);
  });

  ///////////////////////////////////////////
  // User Operations
  ///////////////////////////////////////////

  it("should create a lock", async () => {
    const depositAmount = new anchor.BN(1_000_000_000);
    const totalPayments = new anchor.BN(5);
    const amountPerPayout = depositAmount.div(totalPayments);
    const payoutInterval = new anchor.BN(1); // 1 second

    const tx = await program.methods
      .createLock(depositAmount, totalPayments, amountPerPayout, payoutInterval)
      .accounts({
        creator: creator.publicKey,
        beneficiary: beneficiary.publicKey,
        locker,
        treasury: wallet.publicKey,
        lock,
        lockTokenAccount,
        creatorTokenAccount,
        beneficiaryTokenAccount,
        mint,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      })
      .signers([creator])
      .rpc();

    await provider.connection.confirmTransaction(tx, "confirmed");

    const lockAccount = await program.account.lock.fetch(lock);
    expect(lockAccount.creator.toBase58()).equals(
      creator.publicKey.toBase58(),
      "lockAccount.creator"
    );
    expect(lockAccount.beneficiary.toBase58()).equals(
      beneficiary.publicKey.toBase58(),
      "lockAccount.beneficiary"
    );
    expect(lockAccount.mint.toBase58()).equals(mint.toBase58(), "mint");
    expect(lockAccount.lockTokenAccount.toBase58()).equals(
      lockTokenAccount.toBase58(),
      "lockAccount.lockTokenAccount"
    );
    expect(lockAccount.creatorTokenAccount.toBase58()).equals(
      creatorTokenAccount.toBase58(),
      "lockAccount.creatorTokenAccount"
    );
    expect(lockAccount.beneficiaryTokenAccount.toBase58()).equals(
      beneficiaryTokenAccount.toBase58(),
      "lockAccount.beneficiaryTokenAccount"
    );
    expect(lockAccount.totalPayments.toString()).equals(
      totalPayments.toString(),
      "lockAccount.totalPayments"
    );
    expect(lockAccount.amountPerPayout.toString()).equals(
      (amountPerPayout.toNumber() * LAMPORTS_PER_SOL).toString(),
      "lockAccount.amountPerPayout"
    );
    expect(lockAccount.numPaymentsMade.toNumber()).equals(
      0,
      "lockAccount.numPaymentsMade"
    );
    expect(lockAccount.payoutInterval.toString()).equals(
      payoutInterval.toString(),
      "lockAccount.amountPerPayout"
    );

    const lockTokenAccountInfo = await getAccount(
      provider.connection,
      lockTokenAccount,
      undefined,
      TOKEN_2022_PROGRAM_ID
    );

    const feeTaken = getFee(depositAmount, feeBasisPoints, maxFee);
    expect(lockTokenAccountInfo.amount.toString()).equals(
      (depositAmount.toNumber() * LAMPORTS_PER_SOL - feeTaken).toString(),
      "lockTokenAccountInfo.amount"
    );
    expect(lockTokenAccountInfo.mint.toBase58()).equals(
      mint.toBase58(),
      "lockTokenAccountInfo.mint"
    );
    expect(lockTokenAccountInfo.owner.toBase58()).equals(
      lockTokenAccount.toBase58(),
      "lockTokenAccount.owner"
    );
  });

  it("should disburse to beneficiary", async () => {
    await sleep(250);
    const startingLockAccount = await program.account.lock.fetch(lock);
    const totalPayments = startingLockAccount.totalPayments;
    const startingLockTokenAccountInfo = await getAccount(
      provider.connection,
      lockTokenAccount,
      undefined,
      TOKEN_2022_PROGRAM_ID
    );

    for (let i = 0; i < totalPayments.toNumber(); i++) {
      await sleep(1000);
      const tx = await program.methods
        .disburseToBeneficiary()
        .accounts({
          anyUser: beneficiary.publicKey,
          creator: creator.publicKey,
          beneficiary: beneficiary.publicKey,
          lock,
          lockTokenAccount,
          beneficiaryTokenAccount,
          mint,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        })
        .signers([beneficiary])
        .rpc();

      await provider.connection.confirmTransaction(tx, "confirmed");
    }

    const lockAccount = await program.account.lock.fetch(lock);
    expect(lockAccount.numPaymentsMade.toNumber()).equals(5, "numPaymentsMade");

    const lockTokenAccountInfo = await getAccount(
      provider.connection,
      lockTokenAccount,
      undefined,
      TOKEN_2022_PROGRAM_ID
    );

    const amount =
      BigInt(lockAccount.amountPerPayout.toString()) *
      BigInt(totalPayments.toString());
    const fee =
      BigInt(getFee(new anchor.BN(amount.toString()), feeBasisPoints, maxFee)) *
      BigInt(totalPayments.toString());
    expect(lockTokenAccountInfo.amount.toString()).equals(
      (amount - fee).toString(),
      "lockTokenAccountInfo.amount"
    );
  });

  it("should increase the number of payouts in an existing lock", async () => {
    const numPaymentsIncreaeseAmount = new anchor.BN(5);
    const startingLockAccount = await program.account.lock.fetch(lock);

    const tx = await program.methods
      .increaseNumPayouts(numPaymentsIncreaeseAmount)
      .accounts({
        creator: creator.publicKey,
        lock,
        mint,
        lockTokenAccount,
        creatorTokenAccount,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      })
      .signers([creator])
      .rpc();

    await provider.connection.confirmTransaction(tx, "confirmed");

    const lockAccount = await program.account.lock.fetch(lock);
    expect(lockAccount.totalPayments.toNumber()).equals(
      startingLockAccount.totalPayments.toNumber() +
        numPaymentsIncreaeseAmount.toNumber(),
      "totalPayments"
    );

    const lockTokenAccountInfo = await getAccount(
      provider.connection,
      lockTokenAccount,
      undefined,
      TOKEN_2022_PROGRAM_ID
    );

    expect(lockTokenAccountInfo.amount.toString()).equals(
      (1_000_000_000 * LAMPORTS_PER_SOL).toString(),
      "lockTokenAccountInfo.amount"
    );

    await sleep(2000);
  });

  it("should close an existing lock", async () => {
    const tx = await program.methods
      .closeLock()
      .accounts({
        creator: creator.publicKey,
        lock,
        lockTokenAccount,
        creatorTokenAccount,
        mint,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      })
      .signers([creator])
      .rpc();

    await provider.connection.confirmTransaction(tx, "confirmed");

    try {
      expect(
        await getAccount(
          provider.connection,
          lockTokenAccount,
          undefined,
          TOKEN_2022_PROGRAM_ID
        )
      ).to.throw(TokenAccountNotFoundError);
    } catch (e) {}
  });
});
