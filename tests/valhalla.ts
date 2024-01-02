import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Valhalla } from "../target/types/valhalla";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import {
  Account,
  createMint,
  getAccount,
  getOrCreateAssociatedTokenAccount,
  mintTo,
} from "@solana/spl-token";
import { expect } from "chai";
import { before } from "mocha";

const LOCK_SEED = Buffer.from("lock");
const LOCKER_SEED = Buffer.from("locker");
const LOCK_TOKEN_ACCOUNT_SEED = Buffer.from("token");

describe("Valhalla", () => {
  const provider = anchor.AnchorProvider.env();
  const wallet = provider.wallet;
  const payer = (wallet as NodeWallet).payer;
  anchor.setProvider(provider);

  const program = anchor.workspace.Valhalla as Program<Valhalla>;

  let admin: anchor.web3.Keypair;
  let treasury: anchor.web3.PublicKey;
  let mint: anchor.web3.PublicKey;
  let user: anchor.web3.Keypair;
  let userTokenAccount: Account;
  let lock: anchor.web3.PublicKey;
  let locker: anchor.web3.PublicKey;
  let lockTokenAccount: anchor.web3.PublicKey;

  before(async () => {
    admin = payer;
    treasury = payer.publicKey;
    user = anchor.web3.Keypair.generate();

    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(
        user.publicKey,
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

    userTokenAccount = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      user,
      mint,
      user.publicKey
    );

    await mintTo(
      provider.connection,
      user,
      mint,
      userTokenAccount.address,
      payer,
      1000 * LAMPORTS_PER_SOL
    );

    [locker] = anchor.web3.PublicKey.findProgramAddressSync(
      [LOCKER_SEED],
      program.programId
    );

    [lock] = anchor.web3.PublicKey.findProgramAddressSync(
      [user.publicKey.toBuffer(), mint.toBuffer(), LOCK_SEED],
      program.programId
    );

    [lockTokenAccount] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        lock.toBuffer(),
        user.publicKey.toBuffer(),
        mint.toBuffer(),
        LOCK_TOKEN_ACCOUNT_SEED,
      ],
      program.programId
    );

    console.log();
    console.log("\tAccounts -");
    console.log(`\t\tLock - ${lock.toBase58()}`);
    console.log(`\t\tLock Token Account - ${lockTokenAccount.toBase58()}`);
    console.log(`\t\tUser - ${user.publicKey.toBase58()}`);
    console.log(
      `\t\tUser Token Account - ${userTokenAccount.address.toBase58()}`
    );
    console.log(`\t\tMint - ${mint.toBase58()}`);
    console.log(`\t\tPayer - ${payer.publicKey.toBase58()}`);
    console.log();
  });

  it("should initialize the locker", async () => {
    const tx = await program.methods
      .init(new anchor.BN(0.1 * LAMPORTS_PER_SOL))
      .accounts({
        admin: admin.publicKey,
        locker,
        treasury,
      })
      .signers([admin])
      .rpc();

    await provider.connection.confirmTransaction(tx, "confirmed");

    const lockerAccount = await program.account.locker.fetch(locker);
    expect(lockerAccount.admin.toBase58()).equals(admin.publicKey.toBase58());
    expect(lockerAccount.treasury.toBase58()).equals(treasury.toBase58());
  });

  it("should update the locker fee", async () => {
    let lockerAccount = await program.account.locker.fetch(locker);

    let tx = await program.methods
      .updateLockerFee(new anchor.BN(0.2 * LAMPORTS_PER_SOL))
      .accounts({
        treasury,
        admin: admin.publicKey,
        locker,
      })
      .signers([admin])
      .rpc();

    await provider.connection.confirmTransaction(tx, "confirmed");

    lockerAccount = await program.account.locker.fetch(locker);
    expect(lockerAccount.fee.toNumber()).equals(0.2 * LAMPORTS_PER_SOL);

    tx = await program.methods
      .updateLockerFee(new anchor.BN(0.1 * LAMPORTS_PER_SOL))
      .accounts({
        treasury,
        admin: admin.publicKey,
        locker,
      })
      .signers([admin])
      .rpc();

    await provider.connection.confirmTransaction(tx, "confirmed");

    lockerAccount = await program.account.locker.fetch(locker);
    expect(lockerAccount.fee.toNumber()).equals(0.1 * LAMPORTS_PER_SOL);
  });

  it("should update the locker admin", async () => {
    let lockerAccount = await program.account.locker.fetch(locker);
    expect(lockerAccount.admin.toBase58()).equals(admin.publicKey.toBase58());

    const newAdmin = anchor.web3.Keypair.generate();

    let tx = await program.methods
      .updateLockerAdmin(newAdmin.publicKey)
      .accounts({
        treasury,
        admin: admin.publicKey,
        locker,
      })
      .signers([admin])
      .rpc();

    await provider.connection.confirmTransaction(tx, "confirmed");

    lockerAccount = await program.account.locker.fetch(locker);
    expect(lockerAccount.admin.toBase58()).equals(
      newAdmin.publicKey.toBase58()
    );

    tx = await program.methods
      .updateLockerAdmin(admin.publicKey)
      .accounts({
        treasury,
        admin: newAdmin.publicKey,
        locker,
      })
      .signers([newAdmin])
      .rpc();

    await provider.connection.confirmTransaction(tx, "confirmed");

    lockerAccount = await program.account.locker.fetch(locker);
    expect(lockerAccount.admin.toBase58()).equals(admin.publicKey.toBase58());
  });

  it("should update the locker treasury", async () => {
    let lockerAccount = await program.account.locker.fetch(locker);
    expect(lockerAccount.treasury.toBase58()).equals(treasury.toBase58());

    const newTreasury = anchor.web3.Keypair.generate();

    let tx = await program.methods
      .updateLockerTreasury(newTreasury.publicKey)
      .accounts({
        treasury,
        admin: admin.publicKey,
        locker,
      })
      .signers([admin])
      .rpc();

    await provider.connection.confirmTransaction(tx, "confirmed");

    lockerAccount = await program.account.locker.fetch(locker);
    expect(lockerAccount.treasury.toBase58()).equals(
      newTreasury.publicKey.toBase58()
    );

    tx = await program.methods
      .updateLockerTreasury(treasury)
      .accounts({
        treasury: newTreasury.publicKey,
        admin: admin.publicKey,
        locker,
      })
      .signers([admin])
      .rpc();

    await provider.connection.confirmTransaction(tx, "confirmed");

    lockerAccount = await program.account.locker.fetch(locker);
    expect(lockerAccount.treasury.toBase58()).equals(treasury.toBase58());
  });

  it("should create a lock", async () => {
    const depositAmount = new anchor.BN(100 * LAMPORTS_PER_SOL);
    const lockedDate = new anchor.BN(Math.ceil(new Date().getTime() / 1000));
    const unlockDate = new anchor.BN(
      Math.ceil((new Date().getTime() + 1000 * 60 * 60 * 24 * 30) / 1000)
    );

    const tx = await program.methods
      .createLock(unlockDate, depositAmount)
      .accounts({
        treasury,
        locker,
        user: user.publicKey,
        lock,
        lockTokenAccount,
        userTokenAccount: userTokenAccount.address,
        mint,
      })
      .signers([user])
      .rpc();

    await provider.connection.confirmTransaction(tx, "confirmed");

    const lockAccount = await program.account.lock.fetch(lock);
    expect(lockAccount.user.toBase58()).equals(user.publicKey.toBase58());
    expect(lockAccount.mint.toBase58()).equals(mint.toBase58());
    expect(lockAccount.lockedDate.toNumber()).to.be.closeTo(
      lockedDate.toNumber(),
      2
    );
    expect(lockAccount.unlockDate.toNumber()).equals(unlockDate.toNumber());

    const lockTokenAccountInfo = await getAccount(
      provider.connection,
      lockTokenAccount
    );
    expect(lockTokenAccountInfo.amount.toString()).equals(
      depositAmount.toString()
    );
    expect(lockTokenAccountInfo.mint.toBase58()).equals(mint.toBase58());
    expect(lockTokenAccountInfo.owner.toBase58()).equals(
      lockTokenAccount.toBase58()
    );
  });

  it("should deposit to an existing lock", async () => {
    const depositAmount = new anchor.BN(100 * LAMPORTS_PER_SOL);

    const tx = await program.methods
      .depositToLock(depositAmount)
      .accounts({
        user: user.publicKey,
        lock,
        lockTokenAccount,
        userTokenAccount: userTokenAccount.address,
        mint,
      })
      .signers([user])
      .rpc();

    await provider.connection.confirmTransaction(tx, "confirmed");

    const lockTokenAccountInfo = await getAccount(
      provider.connection,
      lockTokenAccount
    );
    expect(lockTokenAccountInfo.amount.toString()).equals(
      new anchor.BN(2).mul(depositAmount).toString()
    );
    expect(lockTokenAccountInfo.mint.toBase58()).equals(mint.toBase58());
    expect(lockTokenAccountInfo.owner.toBase58()).equals(
      lockTokenAccount.toBase58()
    );
  });

  it("should extend an existing lock", async () => {
    let lockAccount = await program.account.lock.fetch(lock);
    const unlockDate = lockAccount.unlockDate.add(new anchor.BN(1000));

    const tx = await program.methods
      .extendLock(unlockDate)
      .accounts({
        user: user.publicKey,
        lock,
        mint,
      })
      .signers([user])
      .rpc();

    await provider.connection.confirmTransaction(tx, "confirmed");

    lockAccount = await program.account.lock.fetch(lock);
    expect(lockAccount.unlockDate.toNumber()).equals(unlockDate.toNumber());
  });
});
