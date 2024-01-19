import * as anchor from "@coral-xyz/anchor";
import { Valhalla } from "../target/types/valhalla";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import { Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import {
  Account,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAccount,
  TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";
import { assert, expect } from "chai";
import { airdrop } from "./utils/airdrop";
import { mintTransferFeeTokens } from "./utils/mintTransferFeeTokens";
import { getPDAs } from "./utils/getPDAs";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe("⚡️ Valhalla", () => {
  const provider = anchor.AnchorProvider.env();
  const wallet = provider.wallet as NodeWallet;
  const payer = (wallet as NodeWallet).payer;
  anchor.setProvider(provider);

  const program = anchor.workspace.Valhalla as anchor.Program<Valhalla>;

  enum Authority {
    Neither,
    Funder,
    Recipient,
    Both,
  }

  enum VestingType {
    VestingSchedule,
    TokenLock,
    OneTimePayment,
  }

  const name = "Test Lock";
  const funder = anchor.web3.Keypair.generate();
  const recipient = anchor.web3.Keypair.generate();

  const mintKeypair = Keypair.generate();
  let mint = mintKeypair.publicKey;

  const decimals = 9;
  const feeBasisPoints = 100;
  const maxFee = BigInt(10_000 * LAMPORTS_PER_SOL);
  const amountMinted = 10_000_000_000;

  let funderTokenAccount: Account;
  let recipientTokenAccount: Account;
  let lock: anchor.web3.PublicKey;
  let locker: anchor.web3.PublicKey;
  let lockTokenAccount: anchor.web3.PublicKey;

  before(async () => {
    try {
      await airdrop(provider.connection, payer.publicKey);
      await airdrop(provider.connection, funder.publicKey);
      await airdrop(provider.connection, recipient.publicKey);

      [mint, funderTokenAccount, recipientTokenAccount] =
        await mintTransferFeeTokens(
          provider.connection,
          payer,
          decimals,
          feeBasisPoints,
          maxFee,
          funder,
          recipient,
          amountMinted
        );

      [locker] = getPDAs(
        program.programId,
        funder.publicKey,
        recipient.publicKey,
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
    } catch (e) {
      console.log(e);
      assert.fail();
    }
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

    it("should not allow a non-admin to update the locker fee", async () => {
      try {
        const tx = await program.methods
          .adminUpdate(new anchor.BN(0.2 * LAMPORTS_PER_SOL))
          .accounts({
            admin: wallet.publicKey,
            newAdmin: wallet.publicKey,
            locker,
            treasury: wallet.publicKey,
            newTreasury: wallet.publicKey,
          })
          .signers([recipient])
          .rpc();

        await provider.connection.confirmTransaction(tx, "confirmed");

        assert.ok(false);
      } catch (e) {
        expect(e.message).equals(
          `unknown signer: ${recipient.publicKey.toBase58()}`
        );
      }
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

    it("should not allow a non-admin to update the locker treasury", async () => {
      try {
        const newTreasury = Keypair.generate().publicKey;

        const tx = await program.methods
          .adminUpdate(new anchor.BN(0.1 * LAMPORTS_PER_SOL))
          .accounts({
            admin: wallet.publicKey,
            newAdmin: wallet.publicKey,
            locker,
            treasury: wallet.publicKey,
            newTreasury,
          })
          .signers([funder])
          .rpc();

        await provider.connection.confirmTransaction(tx, "confirmed");
      } catch (e) {
        expect(e.message).equals(
          `unknown signer: ${funder.publicKey.toBase58()}`
        );
      }
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
          LAMPORTS_PER_SOL
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

    it("should not allow a non-admin to update the locker admin", async () => {
      try {
        const newAdmin = Keypair.generate();

        const tx = await program.methods
          .adminUpdate(new anchor.BN(0.1 * LAMPORTS_PER_SOL))
          .accounts({
            admin: wallet.publicKey,
            newAdmin: newAdmin.publicKey,
            locker,
            treasury: wallet.publicKey,
            newTreasury: wallet.publicKey,
          })
          .signers([funder])
          .rpc();

        await provider.connection.confirmTransaction(tx, "confirmed");
      } catch (e) {
        expect(e.message).equals(
          `unknown signer: ${funder.publicKey.toBase58()}`
        );
      }
    });
  });

  describe("🔒 Vesting Schedules", () => {
    describe("5 Payouts - No Cliff", () => {
      before(async () => {
        [mint, funderTokenAccount, recipientTokenAccount] =
          await mintTransferFeeTokens(
            provider.connection,
            payer,
            decimals,
            feeBasisPoints,
            maxFee,
            funder,
            recipient,
            amountMinted
          );

        [locker, lock, lockTokenAccount] = getPDAs(
          program.programId,
          funder.publicKey,
          recipient.publicKey,
          mint
        );
      });

      it("should create the lock with the right properties", async () => {
        const amountToBeVested = new anchor.BN(1_000_000_000);
        const vestingDuration = new anchor.BN(5); // 5 seconds for sake of testing time
        const payoutInterval = new anchor.BN(1); // 1 second
        const cliffPaymentAmount = new anchor.BN(0);
        const cancelAuthority = new anchor.BN(Authority.Neither);
        const changeRecipientAuthority = new anchor.BN(Authority.Neither);
        const numPayouts = vestingDuration.div(payoutInterval);
        const amountPerPayout = amountToBeVested.div(numPayouts);
        const vestingType = new anchor.BN(VestingType.VestingSchedule);
        const startDate = new anchor.BN(Date.now() / 1000);
        let nameArg = [];
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
              ),
              program.coder.types.decode("VestingType", vestingType.toBuffer()),
              nameArg
            )
            .accounts({
              funder: funder.publicKey,
              recipient: recipient.publicKey,
              locker,
              treasury: wallet.publicKey,
              lock,
              lockTokenAccount,
              funderTokenAccount: funderTokenAccount.address,
              recipientTokenAccount: recipientTokenAccount.address,
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
        expect(lockAccount.recipient.toBase58()).equals(
          recipient.publicKey.toBase58(),
          "recipient"
        );
        expect(lockAccount.mint.toBase58()).equals(mint.toBase58(), "mint");
        expect(lockAccount.cancelAuthority.neither).to.not.be.undefined;
        expect(lockAccount.changeRecipientAuthority.neither).to.not.be
          .undefined;
        expect(lockAccount.totalVestingDuration.toString()).equals(
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
        expect(lockAccount.lastPaymentTimestamp.toNumber()).to.be.closeTo(
          startDate.toNumber(),
          2,
          "lastPaymentTimestamp"
        );
      });

      it("should not allow the funder to cancel", async () => {
        try {
          const tx = await program.methods
            .cancel()
            .accounts({
              signer: funder.publicKey,
              funder: funder.publicKey,
              recipient: recipient.publicKey,
              lock,
              lockTokenAccount,
              funderTokenAccount: funderTokenAccount.address,
              mint,
              tokenProgram: TOKEN_2022_PROGRAM_ID,
              associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            })
            .transaction();

          await provider.sendAndConfirm(tx, [funder]);
          assert.ok(false);
        } catch (e) {
          const logs = e.logs;
          expect(logs[logs.length - 1]).equals(
            // Unauthorized
            `Program ${program.programId.toBase58()} failed: custom program error: 0x1771`
          );
        }
      });

      it("should not allow the recipient to cancel", async () => {
        try {
          const tx = await program.methods
            .cancel()
            .accounts({
              signer: recipient.publicKey,
              funder: funder.publicKey,
              recipient: recipient.publicKey,
              lock,
              lockTokenAccount,
              funderTokenAccount: funderTokenAccount.address,
              mint,
              tokenProgram: TOKEN_2022_PROGRAM_ID,
              associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            })
            .transaction();

          await provider.sendAndConfirm(tx, [recipient]);
          assert.ok(false);
        } catch (e) {
          const logs = e.logs;
          expect(logs[logs.length - 1]).equals(
            // Unauthorized
            `Program ${program.programId.toBase58()} failed: custom program error: 0x1771`
          );
        }
      });

      it("should not allow the funder to change the recipient", async () => {
        try {
          const tx = await program.methods
            .update()
            .accounts({
              signer: funder.publicKey,
              funder: funder.publicKey,
              recipient: recipient.publicKey,
              newRecipient: funder.publicKey,
              lock,
              mint,
              tokenProgram: TOKEN_2022_PROGRAM_ID,
              associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            })
            .transaction();

          await provider.sendAndConfirm(tx, [funder]);
          assert.ok(false);
        } catch (e) {
          const logs = e.logs;
          expect(logs[logs.length - 1]).equals(
            // Unauthorized
            `Program ${program.programId.toBase58()} failed: custom program error: 0x1771`
          );
        }
      });

      it("should not allow the recipient to change the recipient", async () => {
        try {
          const tx = await program.methods
            .update()
            .accounts({
              signer: recipient.publicKey,
              funder: funder.publicKey,
              recipient: recipient.publicKey,
              newRecipient: funder.publicKey,
              lock,
              mint,
              tokenProgram: TOKEN_2022_PROGRAM_ID,
              associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            })
            .transaction();

          await provider.sendAndConfirm(tx, [recipient]);
          assert.ok(false);
        } catch (e) {
          const logs = e.logs;
          expect(logs[logs.length - 1]).equals(
            // Unauthorized
            `Program ${program.programId.toBase58()} failed: custom program error: 0x1771`
          );
        }
      });

      // TODO: Due to the payout interval and different times it takes to test, it is not possible
      // to determine the amount of tokens being sent. This test should be re-written to check the
      // final balance of the lockTokenAccount
      xit("should disperse the funds to the recipient", async () => {
        // There are 5 disbursements, each of 1 second
        await sleep(750);
        for (let i = 0; i < 5; i++) {
          const startingLockTokenAccountInfo = await getAccount(
            provider.connection,
            lockTokenAccount,
            undefined,
            TOKEN_2022_PROGRAM_ID
          );

          const tx = await program.methods
            .disburse()
            .accounts({
              signer: recipient.publicKey,
              funder: funder.publicKey,
              recipient: recipient.publicKey,
              lock,
              lockTokenAccount,
              recipientTokenAccount: recipientTokenAccount.address,
              mint,
              tokenProgram: TOKEN_2022_PROGRAM_ID,
              associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            })
            .transaction();

          await provider.sendAndConfirm(tx, [recipient]);

          const lockAccount = await program.account.lock.fetch(lock);
          const lockTokenAccountInfo = await getAccount(
            provider.connection,
            lockTokenAccount,
            undefined,
            TOKEN_2022_PROGRAM_ID
          );
          const lockBalance = Number(
            lockTokenAccountInfo.amount / BigInt(LAMPORTS_PER_SOL)
          );
          const expectedAmount = Math.max(
            Number(
              (startingLockTokenAccountInfo.amount -
                BigInt(lockAccount.amountPerPayout.toString())) /
                BigInt(LAMPORTS_PER_SOL)
            ),
            0
          );

          expect(lockBalance).equals(
            expectedAmount,
            "lockTokenAccountInfo.amount"
          );

          await sleep(1050);
        }
      });
    });

    describe("5 Payouts - Cliff", () => {
      before(async () => {
        [mint, funderTokenAccount, recipientTokenAccount] =
          await mintTransferFeeTokens(
            provider.connection,
            payer,
            decimals,
            feeBasisPoints,
            maxFee,
            funder,
            recipient,
            amountMinted
          );

        [locker, lock, lockTokenAccount] = getPDAs(
          program.programId,
          funder.publicKey,
          recipient.publicKey,
          mint
        );
      });

      it("should create the lock with the right properties", async () => {
        const amountToBeVested = new anchor.BN(1_000_000_000);
        const vestingDuration = new anchor.BN(5); // 5 seconds for sake of testing time
        const payoutInterval = new anchor.BN(1); // 1 second
        const cliffPaymentAmount = new anchor.BN(200_000_000);
        const cancelAuthority = new anchor.BN(Authority.Neither);
        const changeRecipientAuthority = new anchor.BN(Authority.Neither);
        const numPayouts = vestingDuration.div(payoutInterval);
        const amountPerPayout = amountToBeVested.div(numPayouts);
        const startDate = new anchor.BN(Date.now() / 1000);
        const vestingType = new anchor.BN(VestingType.VestingSchedule);
        let nameArg = [];
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
              ),
              program.coder.types.decode("VestingType", vestingType.toBuffer()),

              nameArg
            )
            .accounts({
              funder: funder.publicKey,
              recipient: recipient.publicKey,
              locker,
              treasury: wallet.publicKey,
              lock,
              lockTokenAccount,
              funderTokenAccount: funderTokenAccount.address,
              recipientTokenAccount: recipientTokenAccount.address,
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
        expect(lockAccount.recipient.toBase58()).equals(
          recipient.publicKey.toBase58(),
          "recipient"
        );
        expect(lockAccount.mint.toBase58()).equals(mint.toBase58(), "mint");
        expect(lockAccount.cancelAuthority.neither).to.not.be.undefined;
        expect(lockAccount.changeRecipientAuthority.neither).to.not.be
          .undefined;
        expect(lockAccount.totalVestingDuration.toString()).equals(
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
          cliffPaymentAmount.mul(new anchor.BN(LAMPORTS_PER_SOL)).toString(),
          "cliffPaymentAmount"
        );
        expect(lockAccount.lastPaymentTimestamp.toNumber()).to.be.closeTo(
          startDate.toNumber(),
          1,
          "lastPaymentTimestamp"
        );

        const lockTokenAccountInfo = await getAccount(
          provider.connection,
          lockTokenAccount,
          undefined,
          TOKEN_2022_PROGRAM_ID
        );

        const expectedAmount = amountToBeVested
          .mul(new anchor.BN(LAMPORTS_PER_SOL))
          .add(cliffPaymentAmount.mul(new anchor.BN(LAMPORTS_PER_SOL)))
          .sub(new anchor.BN(maxFee.toString()));
        expect(lockTokenAccountInfo.amount.toString()).equals(
          expectedAmount.toString(),
          "lockTokenAccountInfo.amount"
        );
      });

      it("should not allow the funder to cancel", async () => {
        try {
          const tx = await program.methods
            .cancel()
            .accounts({
              signer: funder.publicKey,
              funder: funder.publicKey,
              recipient: recipient.publicKey,
              lock,
              lockTokenAccount,
              funderTokenAccount: funderTokenAccount.address,
              mint,
              tokenProgram: TOKEN_2022_PROGRAM_ID,
              associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            })
            .transaction();

          await provider.sendAndConfirm(tx, [funder]);
          assert.ok(false);
        } catch (e) {
          const logs = e.logs;
          expect(logs[logs.length - 1]).equals(
            // Unauthorized
            `Program ${program.programId.toBase58()} failed: custom program error: 0x1771`
          );
        }
      });

      it("should not allow the recipient to cancel", async () => {
        try {
          const tx = await program.methods
            .cancel()
            .accounts({
              signer: recipient.publicKey,
              funder: funder.publicKey,
              recipient: recipient.publicKey,
              lock,
              lockTokenAccount,
              funderTokenAccount: funderTokenAccount.address,
              mint,
              tokenProgram: TOKEN_2022_PROGRAM_ID,
              associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            })
            .transaction();

          await provider.sendAndConfirm(tx, [recipient]);
          assert.ok(false);
        } catch (e) {
          const logs = e.logs;
          expect(logs[logs.length - 1]).equals(
            // Unauthorized
            `Program ${program.programId.toBase58()} failed: custom program error: 0x1771`
          );
        }
      });

      it("should not allow the funder to change the recipient", async () => {
        try {
          const tx = await program.methods
            .update()
            .accounts({
              signer: funder.publicKey,
              funder: funder.publicKey,
              recipient: recipient.publicKey,
              newRecipient: funder.publicKey,
              lock,
              mint,
              tokenProgram: TOKEN_2022_PROGRAM_ID,
              associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            })
            .transaction();

          await provider.sendAndConfirm(tx, [funder]);
          assert.ok(false);
        } catch (e) {
          const logs = e.logs;
          expect(logs[logs.length - 1]).equals(
            // Unauthorized
            `Program ${program.programId.toBase58()} failed: custom program error: 0x1771`
          );
        }
      });

      it("should not allow the recipient to change the recipient", async () => {
        try {
          const tx = await program.methods
            .update()
            .accounts({
              signer: recipient.publicKey,
              funder: funder.publicKey,
              recipient: recipient.publicKey,
              newRecipient: funder.publicKey,
              lock,
              mint,
              tokenProgram: TOKEN_2022_PROGRAM_ID,
              associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            })
            .transaction();

          await provider.sendAndConfirm(tx, [recipient]);
          assert.ok(false);
        } catch (e) {
          const logs = e.logs;
          expect(logs[logs.length - 1]).equals(
            // Unauthorized
            `Program ${program.programId.toBase58()} failed: custom program error: 0x1771`
          );
        }
      });

      // TODO: Due to the payout interval and different times it takes to test, it is not possible
      // to determine the amount of tokens being sent. This test should be re-written to check the
      // final balance of the lockTokenAccount
      xit("should disperse the funds to the recipient", async () => {
        ///////////////////////////////
        // First disbursement w/ Cliff
        ///////////////////////////////
        let startingLockAccount = await program.account.lock.fetch(lock);
        let startingLockTokenAccountInfo = await getAccount(
          provider.connection,
          lockTokenAccount,
          undefined,
          TOKEN_2022_PROGRAM_ID
        );

        await sleep(750);
        let tx = await program.methods
          .disburse()
          .accounts({
            signer: recipient.publicKey,
            funder: funder.publicKey,
            recipient: recipient.publicKey,
            lock,
            lockTokenAccount,
            recipientTokenAccount: recipientTokenAccount.address,
            mint,
            tokenProgram: TOKEN_2022_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          })
          .transaction();

        await provider.sendAndConfirm(tx, [recipient]);

        let lockAccount = await program.account.lock.fetch(lock);
        let lockTokenAccountInfo = await getAccount(
          provider.connection,
          lockTokenAccount,
          undefined,
          TOKEN_2022_PROGRAM_ID
        );

        let lockBalance = Number(
          lockTokenAccountInfo.amount / BigInt(LAMPORTS_PER_SOL)
        );
        let expectedAmount = Math.max(
          Number(
            (startingLockTokenAccountInfo.amount -
              BigInt(startingLockAccount.cliffPaymentAmount.toString()) -
              BigInt(lockAccount.amountPerPayout.toString())) /
              BigInt(LAMPORTS_PER_SOL)
          ),
          0
        );

        expect(lockBalance).equals(
          expectedAmount,
          "lockTokenAccountInfo.amount"
        );

        ///////////////////////////////
        // Other disbursements w/o Cliff
        ///////////////////////////////
        for (let i = 1; i < 5; i++) {
          await sleep(1000);

          startingLockTokenAccountInfo = await getAccount(
            provider.connection,
            lockTokenAccount,
            undefined,
            TOKEN_2022_PROGRAM_ID
          );

          tx = await program.methods
            .disburse()
            .accounts({
              signer: recipient.publicKey,
              funder: funder.publicKey,
              recipient: recipient.publicKey,
              lock,
              lockTokenAccount,
              recipientTokenAccount: recipientTokenAccount.address,
              mint,
              tokenProgram: TOKEN_2022_PROGRAM_ID,
              associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            })
            .transaction();

          await provider.sendAndConfirm(tx, [recipient]);

          lockAccount = await program.account.lock.fetch(lock);
          lockTokenAccountInfo = await getAccount(
            provider.connection,
            lockTokenAccount,
            undefined,
            TOKEN_2022_PROGRAM_ID
          );
          lockBalance = Number(
            lockTokenAccountInfo.amount / BigInt(LAMPORTS_PER_SOL)
          );
          expectedAmount = Math.max(
            Number(
              (startingLockTokenAccountInfo.amount -
                BigInt(lockAccount.amountPerPayout.toString())) /
                BigInt(LAMPORTS_PER_SOL)
            ),
            0
          );

          expect(lockBalance).equals(
            expectedAmount,
            "lockTokenAccountInfo.amount"
          );
        }
      });
    });
  });
});
