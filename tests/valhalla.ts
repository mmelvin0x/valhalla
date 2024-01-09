import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Valhalla } from "../target/types/valhalla";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import { Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  Account,
  TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";
import { assert, expect } from "chai";
import { airdrop } from "./utils/airdrop";
import { mintTransferFeeTokens } from "./utils/mintTransferFeeTokens";
import { getPDAs } from "./utils/getPDAs";

describe("⚡️ Valhalla", () => {
  const provider = anchor.AnchorProvider.env();
  const wallet = provider.wallet as NodeWallet;
  const payer = (wallet as NodeWallet).payer;
  anchor.setProvider(provider);

  const program = anchor.workspace.Valhalla as Program<Valhalla>;

  enum Authority {
    Neither,
    Funder,
    Beneficiary,
    Both,
  }

  let funder = anchor.web3.Keypair.generate();
  let beneficiary = anchor.web3.Keypair.generate();

  let mintKeypair = Keypair.generate();
  let mint = mintKeypair.publicKey;

  let decimals = 9;
  let feeBasisPoints = 50;
  let maxFee = BigInt(5_000 * LAMPORTS_PER_SOL);
  let amountMinted = 10_000_000_000;

  let funderTokenAccount: Account;
  let beneficiaryTokenAccount: Account;
  let lock: anchor.web3.PublicKey;
  let locker: anchor.web3.PublicKey;
  let lockTokenAccount: anchor.web3.PublicKey;

  before(async () => {
    await airdrop(provider.connection, funder.publicKey);
    await airdrop(provider.connection, beneficiary.publicKey);

    [mint, funderTokenAccount, beneficiaryTokenAccount] =
      await mintTransferFeeTokens(
        provider.connection,
        payer,
        decimals,
        feeBasisPoints,
        maxFee,
        funder,
        beneficiary,
        amountMinted
      );

    [locker, lock, lockTokenAccount] = await getPDAs(
      program.programId,
      funder.publicKey,
      mint
    );

    const tx = await program.methods
      .adminInitialize(new anchor.BN(0.1 * LAMPORTS_PER_SOL))
      .accounts({
        admin: wallet.publicKey,
        locker,
        treasury: wallet.publicKey,
      })
      .signers([payer])
      .rpc();

    await provider.connection.confirmTransaction(tx, "confirmed");

    const lockerAccount = await program.account.locker.fetch(locker);
    expect(lockerAccount.fee.toNumber()).equals(0.1 * LAMPORTS_PER_SOL);
  });

  describe("🛡️ Admin Updates", () => {
    it("should update the locker fee", async () => {
      let tx = await program.methods
        .adminUpdate(new anchor.BN(0.2 * LAMPORTS_PER_SOL))
        .accounts({
          admin: wallet.publicKey,
          newAdmin: wallet.publicKey,
          locker,
          treasury: wallet.publicKey,
          newTreasury: wallet.publicKey,
        })
        .signers([payer])
        .rpc();

      await provider.connection.confirmTransaction(tx, "confirmed");

      const lockerAccount = await program.account.locker.fetch(locker);
      expect(lockerAccount.fee.toNumber()).equals(0.2 * LAMPORTS_PER_SOL);

      tx = await program.methods
        .adminUpdate(new anchor.BN(0.1 * LAMPORTS_PER_SOL))
        .accounts({
          admin: wallet.publicKey,
          newAdmin: wallet.publicKey,
          locker,
          treasury: wallet.publicKey,
          newTreasury: wallet.publicKey,
        })
        .signers([payer])
        .rpc();

      await provider.connection.confirmTransaction(tx, "confirmed");

      const lockerAccount_ = await program.account.locker.fetch(locker);
      expect(lockerAccount_.fee.toNumber()).equals(0.1 * LAMPORTS_PER_SOL);
    });

    it("should update the locker treasury", async () => {
      let lockerAccount;
      const newTreasury = Keypair.generate().publicKey;

      let tx = await program.methods
        .adminUpdate(new anchor.BN(0.1 * LAMPORTS_PER_SOL))
        .accounts({
          admin: wallet.publicKey,
          newAdmin: wallet.publicKey,
          locker,
          treasury: wallet.publicKey,
          newTreasury,
        })
        .signers([payer])
        .rpc();

      await provider.connection.confirmTransaction(tx, "confirmed");

      lockerAccount = await program.account.locker.fetch(locker);
      expect(lockerAccount.treasury.toBase58()).equals(newTreasury.toBase58());

      tx = await program.methods
        .adminUpdate(new anchor.BN(0.1 * LAMPORTS_PER_SOL))
        .accounts({
          admin: wallet.publicKey,
          newAdmin: wallet.publicKey,
          locker,
          treasury: newTreasury,
          newTreasury: wallet.publicKey,
        })
        .signers([payer])
        .rpc();

      await provider.connection.confirmTransaction(tx, "confirmed");

      lockerAccount = await program.account.locker.fetch(locker);
      expect(lockerAccount.treasury.toBase58()).equals(
        wallet.publicKey.toBase58()
      );
    });

    it("should update the locker admin", async () => {
      let lockerAccount = await program.account.locker.fetch(locker);
      const newAdmin = Keypair.generate();

      let tx = await program.methods
        .adminUpdate(new anchor.BN(0.1 * LAMPORTS_PER_SOL))
        .accounts({
          admin: wallet.publicKey,
          newAdmin: newAdmin.publicKey,
          locker,
          treasury: wallet.publicKey,
          newTreasury: wallet.publicKey,
        })
        .signers([payer])
        .rpc();

      await provider.connection.confirmTransaction(tx, "confirmed");

      lockerAccount = await program.account.locker.fetch(locker);
      expect(lockerAccount.admin.toBase58()).equals(
        newAdmin.publicKey.toBase58()
      );

      await provider.connection.confirmTransaction(
        await provider.connection.requestAirdrop(
          newAdmin.publicKey,
          1 * LAMPORTS_PER_SOL
        ),
        "confirmed"
      );

      tx = await program.methods
        .adminUpdate(new anchor.BN(0.1 * LAMPORTS_PER_SOL))
        .accounts({
          admin: newAdmin.publicKey,
          newAdmin: wallet.publicKey,
          locker,
          treasury: wallet.publicKey,
          newTreasury: wallet.publicKey,
        })
        .signers([newAdmin])
        .rpc();

      await provider.connection.confirmTransaction(tx, "confirmed");

      lockerAccount = await program.account.locker.fetch(locker);
      expect(lockerAccount.treasury.toBase58()).equals(
        wallet.publicKey.toBase58()
      );
    });
  });

  describe("🔒 Locks", () => {
    describe("🔒 Create a Basic Lock", () => {
      it("should create a 'Basic Lock'", async () => {
        const amountToBeVested = new anchor.BN(1_000_000_000);
        const vestingDuration = new anchor.BN(5); // 5 seconds for sake of testing time
        const payoutInterval = new anchor.BN(5); // 1 second
        const cliffPaymentAmount = new anchor.BN(0);
        const cancelAuthority = new anchor.BN(Authority.Neither);
        const changeRecipientAuthority = new anchor.BN(Authority.Neither);
        const amountPerPayout = vestingDuration
          .div(payoutInterval)
          .mul(amountToBeVested);
        const startDate = new anchor.BN(Date.now() / 1000);

        try {
          const tx = await program.methods
            .createLock(
              amountToBeVested,
              vestingDuration,
              payoutInterval,
              cliffPaymentAmount,
              startDate,
              program.coder.types.decode(
                "Authority",
                cancelAuthority.toBuffer()
              ),
              program.coder.types.decode(
                "Authority",
                changeRecipientAuthority.toBuffer()
              )
            )
            .accounts({
              funder: funder.publicKey,
              beneficiary: beneficiary.publicKey,
              locker,
              treasury: wallet.publicKey,
              lock,
              lockTokenAccount,
              funderTokenAccount: funderTokenAccount.address,
              beneficiaryTokenAccount: beneficiaryTokenAccount.address,
              mint,
              tokenProgram: TOKEN_2022_PROGRAM_ID,
              associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            })
            .transaction();

          await provider.sendAndConfirm(tx, [funder]);
        } catch (e) {
          console.log(e);
          assert.ok(false);
        }

        const lockAccount = await program.account.lock.fetch(lock);
        expect(lockAccount.funder.toBase58()).equals(
          funder.publicKey.toBase58(),
          "funder"
        );
        expect(lockAccount.beneficiary.toBase58()).equals(
          beneficiary.publicKey.toBase58(),
          "beneficiary"
        );
        expect(lockAccount.mint.toBase58()).equals(mint.toBase58(), "mint");
        expect(lockAccount.cancelAuthority.neither).to.not.be.undefined;
        expect(lockAccount.changeRecipientAuthority.neither).to.not.be
          .undefined;
        expect(lockAccount.vestingDuration.toString()).equals(
          vestingDuration.toString(),
          "vestingDuration"
        );
        expect(lockAccount.payoutInterval.toString()).equals(
          payoutInterval.toString(),
          "payoutInterval"
        );
        expect(lockAccount.amountPerPayout.toString()).equals(
          amountPerPayout.mul(new anchor.BN(LAMPORTS_PER_SOL)).toString(),
          "amountPerPayout"
        );
        expect(lockAccount.startDate.toString()).equals(
          startDate.toString(),
          "startDate"
        );
        expect(lockAccount.cliffPaymentAmount.toString()).equals(
          cliffPaymentAmount.toString(),
          "cliffPaymentAmount"
        );
        expect(lockAccount.numPaymentsMade.toString()).equals(
          "0",
          "numPaymentsMade"
        );
      });

      it("should not allow the depoitor to cancel", async () => {});
      it("should not allow the beneficiary to cancel", async () => {});
      it("should not allow the depoitor to change the beneficiary", async () => {});
      it("should not allow the beneficiary to change the beneficiary", async () => {});
      it("should disperse the funds to the beneficiary", async () => {});
    });

    describe("🔒 Create a Vesting Lock", () => {});
  });

  // it("should create a lock", async () => {
  //   const depositAmount = new anchor.BN(1_000_000_000);
  //   const totalPayments = new anchor.BN(5);
  //   const amountPerPayout = depositAmount.div(totalPayments);
  //   const payoutInterval = new anchor.BN(1); // 1 second

  //   const tx = await program.methods
  //     .createLock(depositAmount, totalPayments, amountPerPayout, payoutInterval)
  //     .accounts({
  //       funder: funder.publicKey,
  //       beneficiary: beneficiary.publicKey,
  //       locker,
  //       treasury: wallet.publicKey,
  //       lock,
  //       lockTokenAccount,
  //       funderTokenAccount,
  //       beneficiaryTokenAccount,
  //       mint,
  //       tokenProgram: TOKEN_2022_PROGRAM_ID,
  //       associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
  //     })
  //     .signers([funder])
  //     .rpc();

  //   await provider.connection.confirmTransaction(tx, "confirmed");

  //   const lockAccount = await program.account.lock.fetch(lock);
  //   expect(lockAccount.funder.toBase58()).equals(
  //     funder.publicKey.toBase58(),
  //     "lockAccount.funder"
  //   );
  //   expect(lockAccount.beneficiary.toBase58()).equals(
  //     beneficiary.publicKey.toBase58(),
  //     "lockAccount.beneficiary"
  //   );
  //   expect(lockAccount.mint.toBase58()).equals(mint.toBase58(), "mint");
  //   expect(lockAccount.lockTokenAccount.toBase58()).equals(
  //     lockTokenAccount.toBase58(),
  //     "lockAccount.lockTokenAccount"
  //   );
  //   expect(lockAccount.funderTokenAccount.toBase58()).equals(
  //     funderTokenAccount.toBase58(),
  //     "lockAccount.funderTokenAccount"
  //   );
  //   expect(lockAccount.beneficiaryTokenAccount.toBase58()).equals(
  //     beneficiaryTokenAccount.toBase58(),
  //     "lockAccount.beneficiaryTokenAccount"
  //   );
  //   expect(lockAccount.totalPayments.toString()).equals(
  //     totalPayments.toString(),
  //     "lockAccount.totalPayments"
  //   );
  //   expect(lockAccount.amountPerPayout.toString()).equals(
  //     (amountPerPayout.toNumber() * LAMPORTS_PER_SOL).toString(),
  //     "lockAccount.amountPerPayout"
  //   );
  //   expect(lockAccount.numPaymentsMade.toNumber()).equals(
  //     0,
  //     "lockAccount.numPaymentsMade"
  //   );
  //   expect(lockAccount.payoutInterval.toString()).equals(
  //     payoutInterval.toString(),
  //     "lockAccount.amountPerPayout"
  //   );

  //   const lockTokenAccountInfo = await getAccount(
  //     provider.connection,
  //     lockTokenAccount,
  //     undefined,
  //     TOKEN_2022_PROGRAM_ID
  //   );

  //   const feeTaken = getFee(depositAmount, feeBasisPoints, maxFee);
  //   expect(lockTokenAccountInfo.amount.toString()).equals(
  //     (depositAmount.toNumber() * LAMPORTS_PER_SOL - feeTaken).toString(),
  //     "lockTokenAccountInfo.amount"
  //   );
  //   expect(lockTokenAccountInfo.mint.toBase58()).equals(
  //     mint.toBase58(),
  //     "lockTokenAccountInfo.mint"
  //   );
  //   expect(lockTokenAccountInfo.owner.toBase58()).equals(
  //     lockTokenAccount.toBase58(),
  //     "lockTokenAccount.owner"
  //   );
  // });

  // it("should disburse to beneficiary", async () => {
  //   await sleep(250);
  //   const startingLockAccount = await program.account.lock.fetch(lock);
  //   const totalPayments = startingLockAccount.totalPayments;
  //   const startingLockTokenAccountInfo = await getAccount(
  //     provider.connection,
  //     lockTokenAccount,
  //     undefined,
  //     TOKEN_2022_PROGRAM_ID
  //   );

  //   for (let i = 0; i < totalPayments.toNumber(); i++) {
  //     await sleep(1000);
  //     const tx = await program.methods
  //       .disburseToBeneficiary()
  //       .accounts({
  //         anyUser: beneficiary.publicKey,
  //         funder: funder.publicKey,
  //         beneficiary: beneficiary.publicKey,
  //         lock,
  //         lockTokenAccount,
  //         beneficiaryTokenAccount,
  //         mint,
  //         tokenProgram: TOKEN_2022_PROGRAM_ID,
  //         associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
  //       })
  //       .signers([beneficiary])
  //       .rpc();

  //     await provider.connection.confirmTransaction(tx, "confirmed");
  //   }

  //   const lockAccount = await program.account.lock.fetch(lock);
  //   expect(lockAccount.numPaymentsMade.toNumber()).equals(5, "numPaymentsMade");

  //   const lockTokenAccountInfo = await getAccount(
  //     provider.connection,
  //     lockTokenAccount,
  //     undefined,
  //     TOKEN_2022_PROGRAM_ID
  //   );

  //   const amount =
  //     BigInt(lockAccount.amountPerPayout.toString()) *
  //     BigInt(totalPayments.toString());
  //   const fee =
  //     BigInt(getFee(new anchor.BN(amount.toString()), feeBasisPoints, maxFee)) *
  //     BigInt(totalPayments.toString());
  //   expect(lockTokenAccountInfo.amount.toString()).equals(
  //     (amount - fee).toString(),
  //     "lockTokenAccountInfo.amount"
  //   );
  // });

  // it("should close an existing lock", async () => {
  //   const tx = await program.methods
  //     .closeLock()
  //     .accounts({
  //       funder: funder.publicKey,
  //       lock,
  //       lockTokenAccount,
  //       funderTokenAccount,
  //       mint,
  //       tokenProgram: TOKEN_2022_PROGRAM_ID,
  //       associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
  //     })
  //     .signers([funder])
  //     .rpc();

  //   await provider.connection.confirmTransaction(tx, "confirmed");

  //   try {
  //     expect(
  //       await getAccount(
  //         provider.connection,
  //         lockTokenAccount,
  //         undefined,
  //         TOKEN_2022_PROGRAM_ID
  //       )
  //     ).to.throw(TokenAccountNotFoundError);
  //   } catch (e) {}
  // });
});
