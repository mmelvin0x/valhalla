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
  getAssociatedTokenAddress,
  getAssociatedTokenAddressSync,
  getOrCreateAssociatedTokenAccount,
  mintTo,
} from "@solana/spl-token";
import { assert, expect } from "chai";
import { findMetadataPda } from "@metaplex-foundation/js";

const LOCK_SEED = Buffer.from("lock");
const LOCKER_SEED = Buffer.from("locker");
const LOCK_TOKEN_ACCOUNT_SEED = Buffer.from("token");
const REWARD_TOKEN_MINT_SEED = Buffer.from("reward");

const TOKEN_METADATA_PROGRAM_ID = new anchor.web3.PublicKey(
  "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
);

const token = {
  name: "Valhalla",
  symbol: "VALHALLA",
  image:
    "https://shdw-drive.genesysgo.net/GoQrLZGWCCLJTudhSNUT3k5Je8rMBohWmsnxu73EoPtD/logo128.png",
  description: "The governance token for Valhalla.",
};

const uri =
  "https://shdw-drive.genesysgo.net/GoQrLZGWCCLJTudhSNUT3k5Je8rMBohWmsnxu73EoPtD/valhalla-metadata.json";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe("Valhalla", () => {
  const provider = anchor.AnchorProvider.env();
  const wallet = provider.wallet;
  const payer = (wallet as NodeWallet).payer;
  anchor.setProvider(provider);

  const program = anchor.workspace.Valhalla as Program<Valhalla>;

  const user = anchor.web3.Keypair.generate();

  let mint: anchor.web3.PublicKey;
  let rewardTokenMint: anchor.web3.PublicKey;
  let userTokenAccount: Account;
  let userRewardTokenAccount: anchor.web3.PublicKey;
  let treasuryRewardTokenAccount: anchor.web3.PublicKey;
  let lock: anchor.web3.PublicKey;
  let locker: anchor.web3.PublicKey;
  let lockTokenAccount: anchor.web3.PublicKey;

  before(async () => {
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

    [rewardTokenMint] = anchor.web3.PublicKey.findProgramAddressSync(
      [REWARD_TOKEN_MINT_SEED],
      program.programId
    );

    treasuryRewardTokenAccount = getAssociatedTokenAddressSync(
      rewardTokenMint,
      wallet.publicKey
    );

    userTokenAccount = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      user,
      mint,
      user.publicKey
    );

    userRewardTokenAccount = getAssociatedTokenAddressSync(
      rewardTokenMint,
      user.publicKey
    );

    await mintTo(
      provider.connection,
      user,
      mint,
      userTokenAccount.address,
      payer,
      2_000_000_000 * LAMPORTS_PER_SOL
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
  });

  ///////////////////////////////////////////
  // Admin Operations
  ///////////////////////////////////////////
  it("should initialize the locker", async () => {
    try {
      const tx = await program.methods
        .init(
          new anchor.BN(0.1 * LAMPORTS_PER_SOL),
          new anchor.BN(100_000_000),
          uri,
          token.name,
          token.symbol
        )
        .accounts({
          admin: wallet.publicKey,
          locker,
          metadata: await findMetadataPda(rewardTokenMint),
          rewardTokenMint,
          treasuryRewardTokenAccount,
          treasury: wallet.publicKey,
          tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
        })
        .signers([(wallet as NodeWallet).payer])
        .rpc();

      await provider.connection.confirmTransaction(tx, "confirmed");

      const lockerAccount = await program.account.locker.fetch(locker);
      expect(lockerAccount.fee.toNumber()).equals(0.1 * LAMPORTS_PER_SOL);
      expect(lockerAccount.admin.toBase58()).equals(
        wallet.publicKey.toBase58()
      );
      expect(lockerAccount.treasury.toBase58()).equals(
        wallet.publicKey.toBase58()
      );

      const treasuryRewardTokenAccountInfo = await getAccount(
        provider.connection,
        treasuryRewardTokenAccount
      );
      expect(treasuryRewardTokenAccountInfo.amount.toString()).equals(
        (100_000_000 * LAMPORTS_PER_SOL).toString()
      );
    } catch (e) {
      console.log(e);
      assert.fail();
    }
  });

  it("should update the locker fee", async () => {
    let lockerAccount = await program.account.locker.fetch(locker);

    let tx = await program.methods
      .updateLockerFee(new anchor.BN(0.2 * LAMPORTS_PER_SOL))
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
      .updateLockerFee(new anchor.BN(0.1 * LAMPORTS_PER_SOL))
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

    try {
      const tx = await program.methods
        .createLock(unlockDate, depositAmount)
        .accounts({
          user: user.publicKey,
          locker,
          treasury: wallet.publicKey,
          lock,
          lockTokenAccount,
          userTokenAccount: userTokenAccount.address,
          userRewardTokenAccount,
          rewardTokenMint,
          mint,
        })
        .signers([user])
        .rpc();

      await provider.connection.confirmTransaction(tx, "confirmed");

      const lockAccount = await program.account.lock.fetch(lock);
      expect(lockAccount.user.toBase58()).equals(user.publicKey.toBase58());
      expect(lockAccount.mint.toBase58()).equals(mint.toBase58());
      expect(lockAccount.unlockDate.toNumber()).equals(unlockDate.toNumber());

      const lockTokenAccountInfo = await getAccount(
        provider.connection,
        lockTokenAccount
      );
      expect(lockTokenAccountInfo.amount.toString()).equals(
        (depositAmount.toNumber() * LAMPORTS_PER_SOL).toString()
      );
      expect(lockTokenAccountInfo.mint.toBase58()).equals(mint.toBase58());
      expect(lockTokenAccountInfo.owner.toBase58()).equals(
        lockTokenAccount.toBase58()
      );
    } catch (e) {
      console.log(e);
      assert.fail();
    }
  });

  it("should deposit to an existing lock", async () => {
    const depositAmount = new anchor.BN(1_000_000_000);

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
      (depositAmount.toNumber() * 2 * LAMPORTS_PER_SOL).toString()
    );
    expect(lockTokenAccountInfo.mint.toBase58()).equals(mint.toBase58());
    expect(lockTokenAccountInfo.owner.toBase58()).equals(
      lockTokenAccount.toBase58()
    );
  });

  it("should withdraw from an existing lock", async () => {
    const withdrawAmount = new anchor.BN(1_000_000_000);

    const tx = await program.methods
      .withdrawFromLock(withdrawAmount)
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
      (withdrawAmount.toNumber() * LAMPORTS_PER_SOL).toString()
    );
    expect(lockTokenAccountInfo.mint.toBase58()).equals(mint.toBase58());
    expect(lockTokenAccountInfo.owner.toBase58()).equals(
      lockTokenAccount.toBase58()
    );
  });

  it("should extend an existing lock", async () => {
    const unlockDate = new anchor.BN(Math.floor(new Date().getTime() / 1000));

    const tx = await program.methods
      .extendLock(unlockDate)
      .accounts({
        user: user.publicKey,
        lock,
        mint,
        lockTokenAccount,
      })
      .signers([user])
      .rpc();

    await provider.connection.confirmTransaction(tx, "confirmed");

    const lockAccount = await program.account.lock.fetch(lock);
    expect(lockAccount.unlockDate.toNumber()).equals(unlockDate.toNumber());

    await sleep(2000);
  });

  it("should close an existing lock", async () => {
    const tx = await program.methods
      .closeLock()
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

    try {
      expect(await getAccount(provider.connection, lockTokenAccount)).to.throw(
        TokenAccountNotFoundError
      );
    } catch (e) {}
  });
});
