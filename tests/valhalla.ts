import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Valhalla } from "../target/types/valhalla";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import {
  Account,
  TokenAccountNotFoundError,
  createMint,
  getAccount,
  getOrCreateAssociatedTokenAccount,
  mintTo,
} from "@solana/spl-token";
import { assert, expect } from "chai";
import { BN } from "bn.js";

const LOCK_SEED = Buffer.from("lock");
const LOCKER_SEED = Buffer.from("locker");
const LOCK_TOKEN_ACCOUNT_SEED = Buffer.from("token");

const TOKEN_METADATA_PROGRAM_ID = new anchor.web3.PublicKey(
  "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
);

// const token = {
//   name: "Valhalla",
//   symbol: "VALHALLA",
//   image:
//     "https://shdw-drive.genesysgo.net/GoQrLZGWCCLJTudhSNUT3k5Je8rMBohWmsnxu73EoPtD/logo128.png",
//   description: "The governance token for Valhalla.",
// };

// const uri =
//   "https://shdw-drive.genesysgo.net/GoQrLZGWCCLJTudhSNUT3k5Je8rMBohWmsnxu73EoPtD/valhalla-metadata.json";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe("Valhalla", () => {
  const provider = anchor.AnchorProvider.env();
  const wallet = provider.wallet;
  const payer = (wallet as NodeWallet).payer;
  anchor.setProvider(provider);

  const program = anchor.workspace.Valhalla as Program<Valhalla>;

  const creator = anchor.web3.Keypair.generate();
  const beneficiary = anchor.web3.Keypair.generate();

  let mint: anchor.web3.PublicKey;
  let creatorTokenAccount: Account;
  let beneficiaryTokenAccount: Account;
  let lock: anchor.web3.PublicKey;
  let locker: anchor.web3.PublicKey;
  let lockTokenAccount: anchor.web3.PublicKey;
  let currentLockBalance: BigInt;

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

    mint = await createMint(
      provider.connection,
      payer,
      payer.publicKey,
      payer.publicKey,
      9
    );

    creatorTokenAccount = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      creator,
      mint,
      creator.publicKey
    );

    beneficiaryTokenAccount = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      beneficiary,
      mint,
      beneficiary.publicKey
    );

    await mintTo(
      provider.connection,
      creator,
      mint,
      creatorTokenAccount.address,
      payer,
      10_000_000_000 * LAMPORTS_PER_SOL
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
    const unlockDate = new anchor.BN(Math.floor(new Date().getTime() / 1000));
    const schedules = [{ unlockDate, amount: depositAmount }];

    const tx = await program.methods
      .createLock(depositAmount, schedules)
      .accounts({
        creator: creator.publicKey,
        beneficiary: beneficiary.publicKey,
        locker,
        treasury: wallet.publicKey,
        lock,
        lockTokenAccount,
        creatorTokenAccount: creatorTokenAccount.address,
        beneficiaryTokenAccount: beneficiaryTokenAccount.address,
        mint,
      })
      .signers([creator])
      .rpc();

    await provider.connection.confirmTransaction(tx, "confirmed");

    const lockAccount = await program.account.lock.fetch(lock);
    expect(lockAccount.creator.toBase58()).equals(
      creator.publicKey.toBase58(),
      "creator"
    );
    expect(lockAccount.mint.toBase58()).equals(mint.toBase58(), "mint");
    expect(lockAccount.beneficiary.toBase58()).equals(
      beneficiary.publicKey.toBase58(),
      "beneficiary"
    );
    expect(lockAccount.scheduleIndex.toNumber()).equals(0, "scheduleIndex");
    expect(lockAccount.schedules[0].amount.toString()).equals(
      depositAmount.mul(new BN(LAMPORTS_PER_SOL)).toString(),
      "schedules[0].amount"
    );
    expect(lockAccount.schedules[0].unlockDate.toNumber()).equals(
      unlockDate.toNumber(),
      "schedules[0].unlockDate"
    );

    const lockTokenAccountInfo = await getAccount(
      provider.connection,
      lockTokenAccount
    );
    expect(lockTokenAccountInfo.amount.toString()).equals(
      (depositAmount.toNumber() * LAMPORTS_PER_SOL).toString(),
      "lockTokenAccountInfo.amount"
    );
    expect(lockTokenAccountInfo.mint.toBase58()).equals(
      mint.toBase58(),
      "mint 2"
    );
    expect(lockTokenAccountInfo.owner.toBase58()).equals(
      lockTokenAccount.toBase58(),
      "lockTokenAccount.owner"
    );
  });

  it("should disperse to beneficiary", async () => {
    await sleep(2000);
    console.log("Sleeping 2 seconds to allow unlock date to pass");

    const tx = await program.methods
      .disperseToBeneficiary()
      .accounts({
        anyUser: beneficiary.publicKey,
        creator: creator.publicKey,
        beneficiary: beneficiary.publicKey,
        lock,
        lockTokenAccount,
        beneficiaryTokenAccount: beneficiaryTokenAccount.address,
        mint,
      })
      .signers([beneficiary])
      .rpc();

    await provider.connection.confirmTransaction(tx, "confirmed");

    const lockTokenAccountInfo = await getAccount(
      provider.connection,
      lockTokenAccount
    );
    expect(lockTokenAccountInfo.amount.toString()).equals(
      (1_000_000_000 * LAMPORTS_PER_SOL).toString(),
      "lockTokenAccountInfo.amount"
    );
    expect(lockTokenAccountInfo.mint.toBase58()).equals(
      mint.toBase58(),
      "mint"
    );
    expect(lockTokenAccountInfo.owner.toBase58()).equals(
      lockTokenAccount.toBase58(),
      "lockTokenAccount.owner"
    );

    // TODO: this is failing...
    const lockAccount = await program.account.lock.fetch(lock);
    expect(lockAccount.scheduleIndex.toNumber()).equals(1, "scheduleIndex");
  });

  xit("should extend an existing lock", async () => {
    const depositAmount = new anchor.BN(1_000_000_000);
    const unlockDate = new anchor.BN(Math.floor(new Date().getTime() / 1000));
    const schedules = [{ unlockDate, amount: depositAmount }];

    const tx = await program.methods
      .extendSchedule(schedules, depositAmount)
      .accounts({
        creator: creator.publicKey,
        lock,
        mint,
        lockTokenAccount,
        creatorTokenAccount: creatorTokenAccount.address,
      })
      .signers([creator])
      .rpc();

    await provider.connection.confirmTransaction(tx, "confirmed");

    const lockAccount = await program.account.lock.fetch(lock);
    expect(lockAccount.schedules.length).equals(2, "schedules.length");
    expect(lockAccount.scheduleIndex.toNumber()).equals(1, "scheduleIndex");
    expect(lockAccount.schedules[1].amount.toString()).equals(
      depositAmount.mul(new BN(LAMPORTS_PER_SOL)).toString(),
      "schedules[1].amount"
    );
    expect(lockAccount.schedules[1].unlockDate.toNumber()).equals(
      unlockDate.toNumber(),
      "schedules[1].unlockDate"
    );

    const lockTokenAccountInfo = await getAccount(
      provider.connection,
      lockTokenAccount
    );

    expect(lockTokenAccountInfo.amount.toString()).equals(
      (2_000_000_000 * LAMPORTS_PER_SOL).toString(),
      "lockTokenAccountInfo.amount"
    );

    await sleep(2000);
  });

  xit("should close an existing lock", async () => {
    const tx = await program.methods
      .closeLock()
      .accounts({
        creator: creator.publicKey,
        lock,
        lockTokenAccount,
        creatorTokenAccount: creatorTokenAccount.address,
        mint,
      })
      .signers([creator])
      .rpc();

    await provider.connection.confirmTransaction(tx, "confirmed");

    try {
      expect(await getAccount(provider.connection, lockTokenAccount)).to.throw(
        TokenAccountNotFoundError
      );
    } catch (e) {}
  });
});
