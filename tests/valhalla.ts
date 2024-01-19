import * as anchor from "@coral-xyz/anchor";

import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  Account,
  TOKEN_2022_PROGRAM_ID,
  getAccount,
} from "@solana/spl-token";
import {
  Authority,
  amountMinted,
  decimals,
  feeBasisPoints,
  maxFee,
  setupTestAccounts,
} from "./utils/constants";
import { Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { ValhallaPDAs, getPDAs } from "./utils/getPDAs";
import { assert, expect } from "chai";

import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import { Valhalla } from "../target/types/valhalla";
import { mintTransferFeeTokens } from "./utils/mintTransferFeeTokens";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe("⚡️ Valhalla", () => {
  const provider = anchor.AnchorProvider.env();
  const wallet = provider.wallet as NodeWallet;
  const payer = (wallet as NodeWallet).payer;
  anchor.setProvider(provider);

  const program = anchor.workspace.Valhalla as anchor.Program<Valhalla>;

  const name = "Test Token 2022";
  const funder = anchor.web3.Keypair.generate();
  const recipient = anchor.web3.Keypair.generate();

  let mint: anchor.web3.PublicKey;
  let funderTokenAccount: Account;
  let recipientTokenAccount: Account;
  let pdas: ValhallaPDAs;

  before(async () => {
    [mint, funderTokenAccount, recipientTokenAccount, pdas] =
      await setupTestAccounts(provider, payer, funder, recipient, program);

    const tx = await program.methods
      .adminInitialize(new anchor.BN(0.1 * LAMPORTS_PER_SOL))
      .accounts({
        admin: wallet.publicKey,
        config: pdas.config,
        treasury: wallet.publicKey,
      })
      .signers([payer])
      .rpc();

    await provider.connection.confirmTransaction(tx, "confirmed");

    const lockerAccount = await program.account.config.fetch(pdas.config);
    expect(lockerAccount.fee.toNumber()).equals(0.1 * LAMPORTS_PER_SOL);
  });

  xdescribe("🛡️ Admin Updates", () => {
    it("should update the config fee", async () => {
      let tx = await program.methods
        .adminUpdate(new anchor.BN(0.2 * LAMPORTS_PER_SOL))
        .accounts({
          admin: wallet.publicKey,
          newAdmin: wallet.publicKey,
          config: pdas.config,
          treasury: wallet.publicKey,
          newTreasury: wallet.publicKey,
        })
        .signers([payer])
        .rpc();

      await provider.connection.confirmTransaction(tx, "confirmed");

      const lockerAccount = await program.account.config.fetch(pdas.config);
      expect(lockerAccount.fee.toNumber()).equals(0.2 * LAMPORTS_PER_SOL);

      tx = await program.methods
        .adminUpdate(new anchor.BN(0.1 * LAMPORTS_PER_SOL))
        .accounts({
          admin: wallet.publicKey,
          newAdmin: wallet.publicKey,
          config: pdas.config,
          treasury: wallet.publicKey,
          newTreasury: wallet.publicKey,
        })
        .signers([payer])
        .rpc();

      await provider.connection.confirmTransaction(tx, "confirmed");

      const lockerAccount_ = await program.account.config.fetch(pdas.config);
      expect(lockerAccount_.fee.toNumber()).equals(0.1 * LAMPORTS_PER_SOL);
    });

    it("should not allow a non-admin to update the config fee", async () => {
      try {
        const tx = await program.methods
          .adminUpdate(new anchor.BN(0.2 * LAMPORTS_PER_SOL))
          .accounts({
            admin: wallet.publicKey,
            newAdmin: wallet.publicKey,
            config: pdas.config,
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

    it("should update the config treasury", async () => {
      let lockerAccount;
      const newTreasury = Keypair.generate().publicKey;

      let tx = await program.methods
        .adminUpdate(new anchor.BN(0.1 * LAMPORTS_PER_SOL))
        .accounts({
          admin: wallet.publicKey,
          newAdmin: wallet.publicKey,
          config: pdas.config,
          treasury: wallet.publicKey,
          newTreasury,
        })
        .signers([payer])
        .rpc();

      await provider.connection.confirmTransaction(tx, "confirmed");

      lockerAccount = await program.account.config.fetch(pdas.config);
      expect(lockerAccount.treasury.toBase58()).equals(newTreasury.toBase58());

      tx = await program.methods
        .adminUpdate(new anchor.BN(0.1 * LAMPORTS_PER_SOL))
        .accounts({
          admin: wallet.publicKey,
          newAdmin: wallet.publicKey,
          config: pdas.config,
          treasury: newTreasury,
          newTreasury: wallet.publicKey,
        })
        .signers([payer])
        .rpc();

      await provider.connection.confirmTransaction(tx, "confirmed");

      lockerAccount = await program.account.config.fetch(pdas.config);
      expect(lockerAccount.treasury.toBase58()).equals(
        wallet.publicKey.toBase58()
      );
    });

    it("should not allow a non-admin to update the config treasury", async () => {
      try {
        const newTreasury = Keypair.generate().publicKey;

        const tx = await program.methods
          .adminUpdate(new anchor.BN(0.1 * LAMPORTS_PER_SOL))
          .accounts({
            admin: wallet.publicKey,
            newAdmin: wallet.publicKey,
            config: pdas.config,
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

    it("should update the config admin", async () => {
      let lockerAccount = await program.account.config.fetch(pdas.config);
      const newAdmin = Keypair.generate();

      let tx = await program.methods
        .adminUpdate(new anchor.BN(0.1 * LAMPORTS_PER_SOL))
        .accounts({
          admin: wallet.publicKey,
          newAdmin: newAdmin.publicKey,
          config: pdas.config,
          treasury: wallet.publicKey,
          newTreasury: wallet.publicKey,
        })
        .signers([payer])
        .rpc();

      await provider.connection.confirmTransaction(tx, "confirmed");

      lockerAccount = await program.account.config.fetch(pdas.config);
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
          config: pdas.config,
          treasury: wallet.publicKey,
          newTreasury: wallet.publicKey,
        })
        .signers([newAdmin])
        .rpc();

      await provider.connection.confirmTransaction(tx, "confirmed");

      lockerAccount = await program.account.config.fetch(pdas.config);
      expect(lockerAccount.treasury.toBase58()).equals(
        wallet.publicKey.toBase58()
      );
    });

    it("should not allow a non-admin to update the config admin", async () => {
      try {
        const newAdmin = Keypair.generate();

        const tx = await program.methods
          .adminUpdate(new anchor.BN(0.1 * LAMPORTS_PER_SOL))
          .accounts({
            admin: wallet.publicKey,
            newAdmin: newAdmin.publicKey,
            config: pdas.config,
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

  xdescribe("🔒 Vesting Schedules", () => {
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

        pdas = getPDAs(
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
        const startDate = new anchor.BN(Date.now() / 1000);
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

        try {
          const tx = await program.methods
            .createVestingSchedule(
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
              nameArg
            )
            .accounts({
              funder: funder.publicKey,
              recipient: recipient.publicKey,
              config: pdas.config,
              treasury: wallet.publicKey,
              vestingSchedule: pdas.vestingSchedule,
              vestingScheduleTokenAccount: pdas.vestingScheduleTokenAccount,
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

        const vestingScheduleAccount =
          await program.account.vestingSchedule.fetch(pdas.vestingSchedule);
        expect(vestingScheduleAccount.funder.toBase58()).equals(
          funder.publicKey.toBase58(),
          "funder"
        );
        expect(vestingScheduleAccount.recipient.toBase58()).equals(
          recipient.publicKey.toBase58(),
          "recipient"
        );
        expect(vestingScheduleAccount.name.toString()).equals(name, "name");
        expect(vestingScheduleAccount.mint.toBase58()).equals(
          mint.toBase58(),
          "mint"
        );
        expect(vestingScheduleAccount.cancelAuthority.neither).to.not.be
          .undefined;
        expect(vestingScheduleAccount.changeRecipientAuthority.neither).to.not
          .be.undefined;
        expect(vestingScheduleAccount.totalVestingDuration.toString()).equals(
          vestingDuration.toString(),
          "vestingDuration"
        );
        expect(vestingScheduleAccount.payoutInterval.toString()).equals(
          payoutInterval.toString(),
          "payoutInterval"
        );
        expect(vestingScheduleAccount.amountPerPayout.toString()).equals(
          amountPerPayout.mul(new anchor.BN(LAMPORTS_PER_SOL)).toString(),
          "amountPerPayout"
        );
        expect(vestingScheduleAccount.startDate.toString()).equals(
          startDate.toString(),
          "startDate"
        );
        expect(vestingScheduleAccount.cliffPaymentAmount.toString()).equals(
          cliffPaymentAmount.toString(),
          "cliffPaymentAmount"
        );
        expect(
          vestingScheduleAccount.lastPaymentTimestamp.toNumber()
        ).to.be.closeTo(startDate.toNumber(), 2, "lastPaymentTimestamp");
      });

      it("should not allow the funder to cancel", async () => {
        try {
          const tx = await program.methods
            .cancelVestingSchedule()
            .accounts({
              signer: funder.publicKey,
              funder: funder.publicKey,
              recipient: recipient.publicKey,
              vestingSchedule: pdas.vestingSchedule,
              vestingScheduleTokenAccount: pdas.vestingScheduleTokenAccount,
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
            .cancelVestingSchedule()
            .accounts({
              signer: recipient.publicKey,
              funder: funder.publicKey,
              recipient: recipient.publicKey,
              vestingSchedule: pdas.vestingSchedule,
              vestingScheduleTokenAccount: pdas.vestingScheduleTokenAccount,
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
            .updateVestingSchedule()
            .accounts({
              signer: funder.publicKey,
              funder: funder.publicKey,
              recipient: recipient.publicKey,
              newRecipient: funder.publicKey,
              vestingSchedule: pdas.vestingSchedule,
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
            .updateVestingSchedule()
            .accounts({
              signer: recipient.publicKey,
              funder: funder.publicKey,
              recipient: recipient.publicKey,
              newRecipient: funder.publicKey,
              vestingSchedule: pdas.vestingSchedule,
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
          const startingVestingScheduleAccountInfo = await getAccount(
            provider.connection,
            pdas.vestingScheduleTokenAccount,
            undefined,
            TOKEN_2022_PROGRAM_ID
          );

          const tx = await program.methods
            .disburseVestingSchedule()
            .accounts({
              signer: recipient.publicKey,
              funder: funder.publicKey,
              recipient: recipient.publicKey,
              vestingSchedule: pdas.vestingSchedule,
              vestingScheduleTokenAccount: pdas.vestingScheduleTokenAccount,
              recipientTokenAccount: recipientTokenAccount.address,
              mint,
              tokenProgram: TOKEN_2022_PROGRAM_ID,
              associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            })
            .transaction();

          await provider.sendAndConfirm(tx, [recipient]);

          const vestingScheduleAccount =
            await program.account.vestingSchedule.fetch(pdas.vestingSchedule);
          const vestingScheduleTokenAccount = await getAccount(
            provider.connection,
            pdas.vestingScheduleTokenAccount,
            undefined,
            TOKEN_2022_PROGRAM_ID
          );
          const lockBalance = Number(
            vestingScheduleTokenAccount.amount / BigInt(LAMPORTS_PER_SOL)
          );
          const expectedAmount = Math.max(
            Number(
              (startingVestingScheduleAccountInfo.amount -
                BigInt(vestingScheduleAccount.amountPerPayout.toString())) /
                BigInt(LAMPORTS_PER_SOL)
            ),
            0
          );

          expect(lockBalance).equals(
            expectedAmount,
            "vestingScheduleTokenAccount.amount"
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

        pdas = getPDAs(
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

        try {
          const tx = await program.methods
            .createVestingSchedule(
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
              nameArg
            )
            .accounts({
              funder: funder.publicKey,
              recipient: recipient.publicKey,
              config: pdas.config,
              treasury: wallet.publicKey,
              vestingSchedule: pdas.vestingSchedule,
              vestingScheduleTokenAccount: pdas.vestingScheduleTokenAccount,
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

        const vestingScheduleAccount =
          await program.account.vestingSchedule.fetch(pdas.vestingSchedule);
        expect(vestingScheduleAccount.funder.toBase58()).equals(
          funder.publicKey.toBase58(),
          "funder"
        );
        expect(vestingScheduleAccount.recipient.toBase58()).equals(
          recipient.publicKey.toBase58(),
          "recipient"
        );
        expect(vestingScheduleAccount.name.toString()).equals(name, "name");
        expect(vestingScheduleAccount.mint.toBase58()).equals(
          mint.toBase58(),
          "mint"
        );
        expect(vestingScheduleAccount.cancelAuthority.neither).to.not.be
          .undefined;
        expect(vestingScheduleAccount.changeRecipientAuthority.neither).to.not
          .be.undefined;
        expect(vestingScheduleAccount.totalVestingDuration.toString()).equals(
          vestingDuration.toString(),
          "vestingDuration"
        );
        expect(vestingScheduleAccount.payoutInterval.toString()).equals(
          payoutInterval.toString(),
          "payoutInterval"
        );
        expect(vestingScheduleAccount.amountPerPayout.toString()).equals(
          amountPerPayout.mul(new anchor.BN(LAMPORTS_PER_SOL)).toString(),
          "amountPerPayout"
        );
        expect(vestingScheduleAccount.startDate.toString()).equals(
          startDate.toString(),
          "startDate"
        );
        expect(vestingScheduleAccount.cliffPaymentAmount.toString()).equals(
          cliffPaymentAmount.mul(new anchor.BN(LAMPORTS_PER_SOL)).toString(),
          "cliffPaymentAmount"
        );
        expect(
          vestingScheduleAccount.lastPaymentTimestamp.toNumber()
        ).to.be.closeTo(startDate.toNumber(), 1, "lastPaymentTimestamp");

        const vestingScheduleTokenAccount = await getAccount(
          provider.connection,
          pdas.vestingScheduleTokenAccount,
          undefined,
          TOKEN_2022_PROGRAM_ID
        );

        const expectedAmount = amountToBeVested
          .mul(new anchor.BN(LAMPORTS_PER_SOL))
          .add(cliffPaymentAmount.mul(new anchor.BN(LAMPORTS_PER_SOL)))
          .sub(new anchor.BN(maxFee.toString()));
        expect(vestingScheduleTokenAccount.amount.toString()).equals(
          expectedAmount.toString(),
          "vestingScheduleTokenAccount.amount"
        );
      });

      it("should not allow the funder to cancel", async () => {
        try {
          const tx = await program.methods
            .cancelVestingSchedule()
            .accounts({
              signer: funder.publicKey,
              funder: funder.publicKey,
              recipient: recipient.publicKey,
              vestingSchedule: pdas.vestingSchedule,
              vestingScheduleTokenAccount: pdas.vestingScheduleTokenAccount,
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
            .cancelVestingSchedule()
            .accounts({
              signer: recipient.publicKey,
              funder: funder.publicKey,
              recipient: recipient.publicKey,
              vestingSchedule: pdas.vestingSchedule,
              vestingScheduleTokenAccount: pdas.vestingScheduleTokenAccount,
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
            .updateVestingSchedule()
            .accounts({
              signer: funder.publicKey,
              funder: funder.publicKey,
              recipient: recipient.publicKey,
              newRecipient: funder.publicKey,
              vestingSchedule: pdas.vestingSchedule,
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
            .updateVestingSchedule()
            .accounts({
              signer: recipient.publicKey,
              funder: funder.publicKey,
              recipient: recipient.publicKey,
              newRecipient: funder.publicKey,
              vestingSchedule: pdas.vestingSchedule,
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
        let startingLockAccount = await program.account.vestingSchedule.fetch(
          pdas.vestingSchedule
        );
        let startingVestingScheduleAccountInfo = await getAccount(
          provider.connection,
          pdas.vestingScheduleTokenAccount,
          undefined,
          TOKEN_2022_PROGRAM_ID
        );

        await sleep(750);
        let tx = await program.methods
          .disburseVestingSchedule()
          .accounts({
            signer: recipient.publicKey,
            funder: funder.publicKey,
            recipient: recipient.publicKey,
            vestingSchedule: pdas.vestingSchedule,
            vestingScheduleTokenAccount: pdas.vestingScheduleTokenAccount,
            recipientTokenAccount: recipientTokenAccount.address,
            mint,
            tokenProgram: TOKEN_2022_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          })
          .transaction();

        await provider.sendAndConfirm(tx, [recipient]);

        let vestingScheduleAccount =
          await program.account.vestingSchedule.fetch(pdas.vestingSchedule);
        let vestingScheduleTokenAccount = await getAccount(
          provider.connection,
          pdas.vestingScheduleTokenAccount,
          undefined,
          TOKEN_2022_PROGRAM_ID
        );

        let lockBalance = Number(
          vestingScheduleTokenAccount.amount / BigInt(LAMPORTS_PER_SOL)
        );
        let expectedAmount = Math.max(
          Number(
            (startingVestingScheduleAccountInfo.amount -
              BigInt(startingLockAccount.cliffPaymentAmount.toString()) -
              BigInt(vestingScheduleAccount.amountPerPayout.toString())) /
              BigInt(LAMPORTS_PER_SOL)
          ),
          0
        );

        expect(lockBalance).equals(
          expectedAmount,
          "vestingScheduleTokenAccount.amount"
        );

        ///////////////////////////////
        // Other disbursements w/o Cliff
        ///////////////////////////////
        for (let i = 1; i < 5; i++) {
          await sleep(1000);

          startingVestingScheduleAccountInfo = await getAccount(
            provider.connection,
            pdas.vestingScheduleTokenAccount,
            undefined,
            TOKEN_2022_PROGRAM_ID
          );

          tx = await program.methods
            .disburseVestingSchedule()
            .accounts({
              signer: recipient.publicKey,
              funder: funder.publicKey,
              recipient: recipient.publicKey,
              vestingSchedule: pdas.vestingSchedule,
              vestingScheduleTokenAccount: pdas.vestingScheduleTokenAccount,
              recipientTokenAccount: recipientTokenAccount.address,
              mint,
              tokenProgram: TOKEN_2022_PROGRAM_ID,
              associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            })
            .transaction();

          await provider.sendAndConfirm(tx, [recipient]);

          vestingScheduleAccount = await program.account.vestingSchedule.fetch(
            pdas.vestingSchedule
          );
          vestingScheduleTokenAccount = await getAccount(
            provider.connection,
            pdas.vestingScheduleTokenAccount,
            undefined,
            TOKEN_2022_PROGRAM_ID
          );
          lockBalance = Number(
            vestingScheduleTokenAccount.amount / BigInt(LAMPORTS_PER_SOL)
          );
          expectedAmount = Math.max(
            Number(
              (startingVestingScheduleAccountInfo.amount -
                BigInt(vestingScheduleAccount.amountPerPayout.toString())) /
                BigInt(LAMPORTS_PER_SOL)
            ),
            0
          );

          expect(lockBalance).equals(
            expectedAmount,
            "vestingScheduleTokenAccount.amount"
          );
        }
      });
    });
  });

  xdescribe("🔒 Token Locks", () => {
    it("should create the lock with the right properties", async () => {
      const amountToBeVested = new anchor.BN(1_000_000_000);
      const vestingDuration = new anchor.BN(1); // 1 seconds for sake of testing time
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

      const createdTimestamp = new anchor.BN(Date.now() / 1000);
      const tx = await program.methods
        .createTokenLock(amountToBeVested, vestingDuration, nameArg)
        .accounts({
          funder: funder.publicKey,
          config: pdas.config,
          treasury: wallet.publicKey,
          tokenLock: pdas.tokenLock,
          tokenLockTokenAccount: pdas.tokenLockTokenAccount,
          funderTokenAccount: funderTokenAccount.address,
          mint,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        })
        .transaction();

      await provider.sendAndConfirm(tx, [funder]);

      const tokenLockAccount = await program.account.tokenLock.fetch(
        pdas.tokenLock
      );
      expect(tokenLockAccount.funder.toBase58()).equals(
        funder.publicKey.toBase58(),
        "funder"
      );
      expect(tokenLockAccount.mint.toBase58()).equals(mint.toBase58(), "mint");
      expect(tokenLockAccount.totalVestingDuration.toString()).equals(
        vestingDuration.toString(),
        "vestingDuration"
      );
      expect(tokenLockAccount.createdTimestamp.toNumber()).to.be.closeTo(
        createdTimestamp.toNumber(),
        1,
        "createdTimestamp"
      );

      const tokenLockTokenAccount = await getAccount(
        provider.connection,
        pdas.tokenLockTokenAccount,
        undefined,
        TOKEN_2022_PROGRAM_ID
      );

      expect(tokenLockTokenAccount.amount.toString()).equals(
        amountToBeVested
          .mul(new anchor.BN(LAMPORTS_PER_SOL))
          .sub(new anchor.BN(maxFee.toString()))
          .toString(),
        "tokenLockTokenAccount.amount"
      );
    });

    it("should not allow a signer that is not the funder to disburse the funds", async () => {
      try {
        const tx = await program.methods
          .disburseTokenLock()
          .accounts({
            funder: funder.publicKey,
            funderTokenAccount: funderTokenAccount.address,
            tokenLock: pdas.tokenLock,
            tokenLockTokenAccount: pdas.tokenLockTokenAccount,
            mint,
            tokenProgram: TOKEN_2022_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          })
          .transaction();

        await provider.sendAndConfirm(tx, [recipient]);
        assert.ok(false);
      } catch (e) {
        expect(e.message).equals(
          `unknown signer: ${recipient.publicKey.toBase58()}`
        );
      }
    });

    it("should disburse the funds", async () => {
      await sleep(1050);
      const tx = await program.methods
        .disburseTokenLock()
        .accounts({
          funder: funder.publicKey,
          funderTokenAccount: funderTokenAccount.address,
          tokenLock: pdas.tokenLock,
          tokenLockTokenAccount: pdas.tokenLockTokenAccount,
          mint,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        })
        .transaction();

      await provider.sendAndConfirm(tx, [funder]);

      const tokenLockTokenAccount = await getAccount(
        provider.connection,
        pdas.tokenLockTokenAccount,
        undefined,
        TOKEN_2022_PROGRAM_ID
      );

      expect(tokenLockTokenAccount.amount.toString()).equals("0");
    });
  });

  describe("🔒 Scheduled Payment", () => {
    it("should create the scheduled payment with the right properties", async () => {
      const amountToBeVested = new anchor.BN(1_000_000_000);
      const vestingDuration = new anchor.BN(1); // 1 seconds for sake of testing time
      const cancelAuthority = new anchor.BN(Authority.Neither);
      const changeRecipientAuthority = new anchor.BN(Authority.Neither);
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
      const tx = await program.methods
        .createScheduledPayment(
          amountToBeVested,
          vestingDuration,
          program.coder.types.decode("Authority", cancelAuthority.toBuffer()),
          program.coder.types.decode(
            "Authority",
            changeRecipientAuthority.toBuffer()
          ),
          nameArg
        )
        .accounts({
          funder: funder.publicKey,
          recipient: recipient.publicKey,
          config: pdas.config,
          treasury: wallet.publicKey,
          scheduledPayment: pdas.scheduledPayment,
          scheduledPaymentTokenAccount: pdas.scheduledPaymentTokenAccount,
          funderTokenAccount: funderTokenAccount.address,
          recipientTokenAccount: recipientTokenAccount.address,
          mint,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        })
        .transaction();

      await provider.sendAndConfirm(tx, [funder]);

      const scheduledPaymentAccount =
        await program.account.scheduledPayment.fetch(pdas.scheduledPayment);

      expect(scheduledPaymentAccount.funder.toBase58()).equals(
        funder.publicKey.toBase58(),
        "funder"
      );
      expect(scheduledPaymentAccount.recipient.toBase58()).equals(
        recipient.publicKey.toBase58(),
        "recipient"
      );
      expect(scheduledPaymentAccount.mint.toBase58()).equals(
        mint.toBase58(),
        "mint"
      );
      expect(scheduledPaymentAccount.cancelAuthority.neither).to.not.be
        .undefined;
      expect(scheduledPaymentAccount.changeRecipientAuthority.neither).to.not.be
        .undefined;
      expect(scheduledPaymentAccount.totalVestingDuration.toString()).equals(
        vestingDuration.toString(),
        "vestingDuration"
      );
    });
  });
});
