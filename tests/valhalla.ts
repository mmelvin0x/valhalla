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
const LOCK_TOKEN_ACCOUNT_SEED = Buffer.from("token");

describe("Valhalla", () => {
  const provider = anchor.AnchorProvider.env();
  const wallet = provider.wallet;
  const payer = (wallet as NodeWallet).payer;
  anchor.setProvider(provider);

  const program = anchor.workspace.Valhalla as Program<Valhalla>;

  let mint: anchor.web3.PublicKey;
  let user: anchor.web3.Keypair;
  let userTokenAccount: Account;
  let locker: anchor.web3.PublicKey;
  let lock: anchor.web3.PublicKey;
  let lockTokenAccount: anchor.web3.PublicKey;

  before(async () => {
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

  it("should create a lock", async () => {
    const depositAmount = new anchor.BN(100 * LAMPORTS_PER_SOL);
    const lockedDate = new anchor.BN(Math.ceil(new Date().getTime() / 1000));
    const unlockDate = new anchor.BN(
      Math.ceil((new Date().getTime() + 1000 * 60 * 60 * 24 * 30) / 1000)
    );

    const tx = await program.methods
      .createLock(unlockDate, depositAmount)
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
    const previousUnlockDate = lockAccount.unlockDate;
    const unlockDate = new anchor.BN(60 * 60 * 24 * 60);

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
    expect(lockAccount.unlockDate.toNumber()).equals(
      previousUnlockDate.toNumber() + unlockDate.toNumber()
    );
  });
});
