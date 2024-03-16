import * as anchor from "@coral-xyz/anchor";

import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  Account,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  getAccount,
  getOrCreateAssociatedTokenAccount,
  harvestWithheldTokensToMint,
} from "@solana/spl-token";
import {
  Authority,
  confirm,
  getAuthority,
  getName,
  setupTestAccounts,
  sleep,
} from "./utils/utils";
import { Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { assert, expect } from "chai";

import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import { PublicKey } from "@metaplex-foundation/js";
import { Valhalla } from "../target/types/valhalla";
import { getPDAs } from "./utils/getPDAs";
import { randomBytes } from "crypto";

describe("⚡️ Valhalla", () => {
  const provider = anchor.AnchorProvider.env();
  const wallet = provider.wallet as NodeWallet;
  const payer = (wallet as NodeWallet).payer;
  anchor.setProvider(provider);

  const program = anchor.workspace.Valhalla as anchor.Program<Valhalla>;

  const creator = Keypair.generate();
  const recipient = Keypair.generate();
  const randomUser = Keypair.generate();
  const tokenTreasury = Keypair.generate();

  let identifier: anchor.BN;
  let mint: PublicKey;
  let creatorTokenAccount: Account;
  let recipientTokenAccount: Account;
  let treasuryTokenAccount: Account;
  let creatorRewardAta: Account;
  let userRewardAta: Account;
  let rewardTokenMint: PublicKey;

  before(async () => {
    rewardTokenMint = PublicKey.findProgramAddressSync(
      [Buffer.from("reward_token_mint")],
      program.programId
    )[0];

    [mint, creatorTokenAccount, recipientTokenAccount, treasuryTokenAccount] =
      await setupTestAccounts(
        provider,
        payer,
        creator,
        recipient,
        randomUser,
        tokenTreasury
      );
  });

  describe("Create Config", () => {
    it("should fail if the token fee basis points are greater than 10000", async () => {
      try {
        const { config } = await getPDAs(program.programId);
        const tx = await program.methods
          .createConfig(
            new anchor.BN(0.025 * LAMPORTS_PER_SOL),
            new anchor.BN(10001),
            new anchor.BN(10 * LAMPORTS_PER_SOL)
          )
          .accounts({
            admin: payer.publicKey,
            config,
            solTreasury: payer.publicKey,
            tokenTreasury: tokenTreasury.publicKey,
            rewardTokenMint,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([])
          .rpc();

        await confirm(provider.connection, tx);
        assert.fail("Expected an error");
      } catch (e) {
        expect(e.error.errorCode.code).equals("InvalidTokenFeeBasisPoints");
        expect(e.error.errorCode.number).equals(6005);
        expect(e.error.errorMessage).equals(
          "Token fee basis points are invalid!"
        );
      }
    });

    it("should create a config", async () => {
      const { config } = await getPDAs(program.programId);
      const solFee = new anchor.BN(0.025 * LAMPORTS_PER_SOL);
      const tokenFeeBasisPoints = new anchor.BN(10);
      const rewardTokenAmount = new anchor.BN(10 * LAMPORTS_PER_SOL);

      const tx = await program.methods
        .createConfig(solFee, tokenFeeBasisPoints, rewardTokenAmount)
        .accounts({
          admin: payer.publicKey,
          config,
          solTreasury: payer.publicKey,
          tokenTreasury: tokenTreasury.publicKey,
          rewardTokenMint,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([])
        .rpc();

      await confirm(provider.connection, tx);

      const configAccount = await program.account.config.fetch(config);

      expect(configAccount.admin.toString()).equals(payer.publicKey.toString());
      expect(configAccount.solTreasury.toString()).equals(
        payer.publicKey.toString()
      );
      expect(configAccount.tokenTreasury.toString()).equals(
        tokenTreasury.publicKey.toString()
      );
      expect(configAccount.solFee.toString()).equals(solFee.toString());
      expect(configAccount.tokenFeeBasisPoints.toString()).equals(
        tokenFeeBasisPoints.toString()
      );
      expect(configAccount.rewardTokenAmount.toString()).equals(
        rewardTokenAmount.toString()
      );
      expect(configAccount.rewardTokenMintKey.toString()).equals(
        rewardTokenMint.toString()
      );

      // Define these now that the reward token mint is created
      creatorRewardAta = await getOrCreateAssociatedTokenAccount(
        provider.connection,
        creator,
        rewardTokenMint,
        creator.publicKey,
        false,
        undefined,
        undefined,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );

      userRewardAta = await getOrCreateAssociatedTokenAccount(
        provider.connection,
        randomUser,
        rewardTokenMint,
        randomUser.publicKey,
        false,
        undefined,
        undefined,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );
    });

    it("should fail if the config account is already initialized", async () => {
      try {
        const { config } = await getPDAs(program.programId);
        const tx = await program.methods
          .createConfig(
            new anchor.BN(0.025 * LAMPORTS_PER_SOL),
            new anchor.BN(10),
            new anchor.BN(10 * LAMPORTS_PER_SOL)
          )
          .accounts({
            admin: payer.publicKey,
            config,
            solTreasury: payer.publicKey,
            tokenTreasury: tokenTreasury.publicKey,
            rewardTokenMint,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([])
          .rpc();

        await confirm(provider.connection, tx);
        assert.fail("Expected an error");
      } catch (e) {
        expect(e.logs[3].includes("already in use")).equals(true);
      }
    });
  });

  describe("Update Config", () => {
    it("should update to a new admin", async () => {
      const { config } = await getPDAs(program.programId);
      const solFee = new anchor.BN(0.025 * LAMPORTS_PER_SOL);
      const tokenFeeBasisPoints = new anchor.BN(10);
      const rewardTokenAmount = new anchor.BN(10 * LAMPORTS_PER_SOL);

      let tx = await program.methods
        .updateConfig(solFee, tokenFeeBasisPoints, rewardTokenAmount)
        .accounts({
          admin: payer.publicKey,
          newAdmin: creator.publicKey,
          newTokenTreasury: tokenTreasury.publicKey,
          config,
        })
        .signers([payer])
        .rpc();

      await confirm(provider.connection, tx);

      let configAccount = await program.account.config.fetch(config);

      expect(configAccount.admin.toString()).equals(
        creator.publicKey.toString()
      );

      // set it back to original
      tx = await program.methods
        .updateConfig(solFee, tokenFeeBasisPoints, rewardTokenAmount)
        .accounts({
          admin: creator.publicKey,
          newAdmin: payer.publicKey,
          newTokenTreasury: tokenTreasury.publicKey,
          config,
        })
        .signers([creator])
        .rpc();

      await confirm(provider.connection, tx);

      configAccount = await program.account.config.fetch(config);

      expect(configAccount.admin.toString()).equals(payer.publicKey.toString());

      // check the rest are unchanged
      expect(configAccount.solTreasury.toString()).equals(
        payer.publicKey.toString()
      );
      expect(configAccount.tokenTreasury.toString()).equals(
        tokenTreasury.publicKey.toString()
      );
      expect(configAccount.solFee.toString()).equals(solFee.toString());
      expect(configAccount.tokenFeeBasisPoints.toString()).equals(
        tokenFeeBasisPoints.toString()
      );
      expect(configAccount.rewardTokenAmount.toString()).equals(
        rewardTokenAmount.toString()
      );
      expect(configAccount.rewardTokenMintKey.toString()).equals(
        rewardTokenMint.toString()
      );
    });

    it("should update the new token treasury", async () => {
      const { config } = await getPDAs(program.programId);
      const solFee = new anchor.BN(0.025 * LAMPORTS_PER_SOL);
      const tokenFeeBasisPoints = new anchor.BN(10);
      const rewardTokenAmount = new anchor.BN(10 * LAMPORTS_PER_SOL);
      const newTokenTreasury = Keypair.generate();

      let tx = await program.methods
        .updateConfig(solFee, tokenFeeBasisPoints, rewardTokenAmount)
        .accounts({
          admin: payer.publicKey,
          newAdmin: payer.publicKey,
          newTokenTreasury: newTokenTreasury.publicKey,
          config,
        })
        .signers([payer])
        .rpc();

      await confirm(provider.connection, tx);

      let configAccount = await program.account.config.fetch(config);

      expect(configAccount.tokenTreasury.toString()).equals(
        newTokenTreasury.publicKey.toString()
      );

      // set it back to original
      tx = await program.methods
        .updateConfig(solFee, tokenFeeBasisPoints, rewardTokenAmount)
        .accounts({
          admin: payer.publicKey,
          newAdmin: payer.publicKey,
          newTokenTreasury: tokenTreasury.publicKey,
          config,
        })
        .signers([payer])
        .rpc();

      await confirm(provider.connection, tx);

      configAccount = await program.account.config.fetch(config);

      expect(configAccount.tokenTreasury.toString()).equals(
        tokenTreasury.publicKey.toString()
      );
    });

    it("should update the new token fee basis points", async () => {
      const { config } = await getPDAs(program.programId);
      const solFee = new anchor.BN(0.025 * LAMPORTS_PER_SOL);
      const tokenFeeBasisPoints = new anchor.BN(10);
      const newTokenFeeBasisPoints = new anchor.BN(15);
      const rewardTokenAmount = new anchor.BN(10 * LAMPORTS_PER_SOL);

      let tx = await program.methods
        .updateConfig(solFee, newTokenFeeBasisPoints, rewardTokenAmount)
        .accounts({
          admin: payer.publicKey,
          newAdmin: payer.publicKey,
          newTokenTreasury: tokenTreasury.publicKey,
          config,
        })
        .signers([payer])
        .rpc();

      await confirm(provider.connection, tx);

      let configAccount = await program.account.config.fetch(config);

      expect(configAccount.tokenFeeBasisPoints.toString()).equals(
        newTokenFeeBasisPoints.toString()
      );

      // set it back to original
      tx = await program.methods
        .updateConfig(solFee, tokenFeeBasisPoints, rewardTokenAmount)
        .accounts({
          admin: payer.publicKey,
          newAdmin: payer.publicKey,
          newTokenTreasury: tokenTreasury.publicKey,
          config,
        })
        .signers([payer])
        .rpc();

      await confirm(provider.connection, tx);

      configAccount = await program.account.config.fetch(config);

      expect(configAccount.tokenTreasury.toString()).equals(
        tokenTreasury.publicKey.toString()
      );
    });

    it("should update the new sol fee", async () => {
      const { config } = await getPDAs(program.programId);
      const solFee = new anchor.BN(0.025 * LAMPORTS_PER_SOL);
      const newSolFee = new anchor.BN(0.03 * LAMPORTS_PER_SOL);
      const tokenFeeBasisPoints = new anchor.BN(10);
      const rewardTokenAmount = new anchor.BN(10 * LAMPORTS_PER_SOL);

      let tx = await program.methods
        .updateConfig(newSolFee, tokenFeeBasisPoints, rewardTokenAmount)
        .accounts({
          admin: payer.publicKey,
          newAdmin: payer.publicKey,
          newTokenTreasury: tokenTreasury.publicKey,
          config,
        })
        .signers([payer])
        .rpc();

      await confirm(provider.connection, tx);

      let configAccount = await program.account.config.fetch(config);

      expect(configAccount.solFee.toString()).equals(newSolFee.toString());

      // set it back to original
      tx = await program.methods
        .updateConfig(solFee, tokenFeeBasisPoints, rewardTokenAmount)
        .accounts({
          admin: payer.publicKey,
          newAdmin: payer.publicKey,
          newTokenTreasury: tokenTreasury.publicKey,
          config,
        })
        .signers([payer])
        .rpc();

      await confirm(provider.connection, tx);

      configAccount = await program.account.config.fetch(config);

      expect(configAccount.rewardTokenMintKey.toString()).equals(
        rewardTokenMint.toString()
      );
    });

    it("should update the new reward token amount", async () => {
      const { config } = await getPDAs(program.programId);
      const solFee = new anchor.BN(0.025 * LAMPORTS_PER_SOL);
      const newSolFee = new anchor.BN(0.03 * LAMPORTS_PER_SOL);
      const tokenFeeBasisPoints = new anchor.BN(10);
      const rewardTokenAmount = new anchor.BN(10 * LAMPORTS_PER_SOL);
      const newRewardTokenAmount = new anchor.BN(15 * LAMPORTS_PER_SOL);

      let tx = await program.methods
        .updateConfig(newSolFee, tokenFeeBasisPoints, newRewardTokenAmount)
        .accounts({
          admin: payer.publicKey,
          newAdmin: payer.publicKey,
          newTokenTreasury: tokenTreasury.publicKey,
          config,
        })
        .signers([payer])
        .rpc();

      await confirm(provider.connection, tx);

      let configAccount = await program.account.config.fetch(config);

      expect(configAccount.rewardTokenAmount.toString()).equals(
        newRewardTokenAmount.toString()
      );

      // set it back to original
      tx = await program.methods
        .updateConfig(solFee, tokenFeeBasisPoints, rewardTokenAmount)
        .accounts({
          admin: payer.publicKey,
          newAdmin: payer.publicKey,
          newTokenTreasury: tokenTreasury.publicKey,
          config,
        })
        .signers([payer])
        .rpc();

      await confirm(provider.connection, tx);

      configAccount = await program.account.config.fetch(config);

      expect(configAccount.rewardTokenMintKey.toString()).equals(
        rewardTokenMint.toString()
      );
    });

    it("should fail if the signer is not the admin", async () => {
      const { config } = await getPDAs(program.programId);
      const solFee = new anchor.BN(0.025 * LAMPORTS_PER_SOL);
      const tokenFeeBasisPoints = new anchor.BN(10);
      const rewardTokenAmount = new anchor.BN(10 * LAMPORTS_PER_SOL);

      try {
        const tx = await program.methods
          .updateConfig(solFee, tokenFeeBasisPoints, rewardTokenAmount)
          .accounts({
            admin: payer.publicKey,
            newAdmin: payer.publicKey,
            newTokenTreasury: tokenTreasury.publicKey,
            config,
          })
          .signers([creator])
          .rpc();

        await confirm(provider.connection, tx);
        assert.fail("Expected an error");
      } catch (e) {
        expect(e.message.includes("unknown signer")).equals(true);
      }
    });

    it("should fail if the new sol fee is less than the minimum sol fee", async () => {
      const { config } = await getPDAs(program.programId);
      const solFee = new anchor.BN(0.000001 * LAMPORTS_PER_SOL);
      const tokenFeeBasisPoints = new anchor.BN(10);
      const rewardTokenAmount = new anchor.BN(10 * LAMPORTS_PER_SOL);

      try {
        const tx = await program.methods
          .updateConfig(solFee, tokenFeeBasisPoints, rewardTokenAmount)
          .accounts({
            admin: payer.publicKey,
            newAdmin: payer.publicKey,
            newTokenTreasury: tokenTreasury.publicKey,
            config,
          })
          .signers([payer])
          .rpc();

        await confirm(provider.connection, tx);
        assert.fail("Expected an error");
      } catch (e) {
        expect(e.error.errorCode.code).equals("InvalidSolFee");
        expect(e.error.errorCode.number).equals(6006);
        expect(e.error.errorMessage).equals("SOL fee is invalid!");
      }
    });

    it('should fail if the new token fee basis points is greater than "500"', async () => {
      const { config } = await getPDAs(program.programId);
      const solFee = new anchor.BN(0.015 * LAMPORTS_PER_SOL);
      const tokenFeeBasisPoints = new anchor.BN(501);
      const rewardTokenAmount = new anchor.BN(10 * LAMPORTS_PER_SOL);

      try {
        const tx = await program.methods
          .updateConfig(solFee, tokenFeeBasisPoints, rewardTokenAmount)
          .accounts({
            admin: payer.publicKey,
            newAdmin: payer.publicKey,
            newTokenTreasury: tokenTreasury.publicKey,
            config,
          })
          .signers([payer])
          .rpc();

        await confirm(provider.connection, tx);
        assert.fail("Expected an error");
      } catch (e) {
        expect(e.error.errorCode.code).equals("InvalidTokenFeeBasisPoints");
        expect(e.error.errorCode.number).equals(6005);
        expect(e.error.errorMessage).equals(
          "Token fee basis points are invalid!"
        );
      }
    });
  });

  describe("Vault w/ Neither Cancel Authority", () => {
    it("should create a vault", async () => {
      identifier = new anchor.BN(randomBytes(8));
      const name = getName("Vault");
      const amountToBeVested = new anchor.BN(100);
      const totalVestingDuration = new anchor.BN(10);
      const startDate = new anchor.BN(new Date().getTime() / 1000);
      const payoutInterval = new anchor.BN(1);
      const cancelAuthority = await getAuthority(Authority.Neither, program);
      const { config, vault, vaultAta } = await getPDAs(
        program.programId,
        identifier,
        creator.publicKey,
        mint
      );

      const solTreasuryBalanceBefore = await provider.connection.getBalance(
        payer.publicKey
      );

      const treasuryAtaBefore = await getAccount(
        provider.connection,
        treasuryTokenAccount.address,
        undefined,
        TOKEN_2022_PROGRAM_ID
      );

      expect(treasuryAtaBefore.amount).equals(
        0n,
        "Token treasury amount failed - 1"
      );

      const creatorRewardAccountBefore = await getAccount(
        provider.connection,
        creatorRewardAta.address,
        undefined,
        TOKEN_PROGRAM_ID
      );

      expect(creatorRewardAccountBefore.amount).equals(
        0n,
        "Creator reward amount failed - 1"
      );

      const tx = await program.methods
        .create(
          identifier,
          name,
          amountToBeVested,
          totalVestingDuration,
          startDate,
          payoutInterval,
          cancelAuthority
        )
        .accounts({
          creator: creator.publicKey,
          recipient: recipient.publicKey,
          solTreasury: payer.publicKey,
          tokenTreasury: tokenTreasury.publicKey,
          config,
          vault,
          vaultAta,
          tokenTreasuryAta: treasuryTokenAccount.address,
          creatorAta: creatorTokenAccount.address,
          creatorRewardAta: creatorRewardAta.address,
          rewardTokenMint,
          mint,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
          rewardTokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([creator])
        .rpc();

      await confirm(provider.connection, tx);

      const configAccount = await program.account.config.fetch(config);
      const vaultAccount = await program.account.vault.fetch(vault);

      expect(vaultAccount.identifier.toString()).equals(
        identifier.toString(),
        "Identifier failed"
      );
      expect(vaultAccount.creator.toString()).equals(
        creator.publicKey.toString(),
        "Creator failed"
      );
      expect(vaultAccount.recipient.toString()).equals(
        recipient.publicKey.toString(),
        "Recipient failed"
      );
      expect(vaultAccount.mint.toString()).equals(
        mint.toString(),
        "Mint failed"
      );
      expect(vaultAccount.totalVestingDuration.toString()).equals(
        totalVestingDuration.toString(),
        "Total vesting duration failed"
      );
      expect(vaultAccount.startDate.toString()).equals(
        startDate.toString(),
        "Start date failed"
      );
      expect(vaultAccount.payoutInterval.toString()).equals(
        payoutInterval.toString(),
        "Total number of payouts failed"
      );
      expect(vaultAccount.numberOfPaymentsMade.toString()).equals(
        Number(0).toString(),
        "Number of payments made failed"
      );
      expect(vaultAccount.cancelAuthority.toString()).equals(
        cancelAuthority.toString(),
        "Cancel authority failed"
      );

      const solTreasuryBalanceAfter = await provider.connection.getBalance(
        payer.publicKey
      );

      const treasuryAtaAfter = await getAccount(
        provider.connection,
        treasuryTokenAccount.address,
        undefined,
        TOKEN_2022_PROGRAM_ID
      );

      const creatorRewardAccountAfter = await getAccount(
        provider.connection,
        creatorRewardAta.address,
        undefined,
        TOKEN_PROGRAM_ID
      );

      expect(solTreasuryBalanceAfter).gt(
        solTreasuryBalanceBefore,
        "Sol treasury balance failed"
      );

      expect(Number(treasuryAtaAfter.amount)).gt(
        Number(treasuryAtaBefore.amount),
        "Token treasury amount failed - 2"
      );

      expect(creatorRewardAccountAfter.amount.toString()).equals(
        configAccount.rewardTokenAmount.toString(),
        "Creator reward amount failed - 2"
      );
    });

    it("should not allow cancellation", async () => {
      try {
        const { vault, vaultAta } = await getPDAs(
          program.programId,
          identifier,
          creator.publicKey,
          mint
        );
        const tx = await program.methods
          .cancel()
          .accounts({
            signer: creator.publicKey,
            creator: creator.publicKey,
            recipient: recipient.publicKey,
            vault,
            vaultAta,
            creatorAta: creatorTokenAccount.address,
            mint,
            tokenProgram: TOKEN_2022_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([creator])
          .rpc();

        await confirm(provider.connection, tx);
        assert.fail();
      } catch (e) {
        expect(e.error.errorCode.code).equals("Unauthorized");
        expect(e.error.errorCode.number).equals(6001);
        expect(e.error.errorMessage).equals(
          "Not authorized to perform this action!"
        );
      }
    });

    it("should not disburse if vault is locked", async () => {
      try {
        const { config, vault, vaultAta } = await getPDAs(
          program.programId,
          identifier,
          creator.publicKey,
          mint
        );

        const tx = await program.methods
          .disburse()
          .accounts({
            signer: creator.publicKey,
            creator: creator.publicKey,
            recipient: recipient.publicKey,
            solTreasury: payer.publicKey,
            config,
            vault,
            vaultAta,
            signerRewardAta: creatorRewardAta.address,
            recipientAta: recipientTokenAccount.address,
            mint,
            rewardTokenMint,
            tokenProgram: TOKEN_2022_PROGRAM_ID,
            rewardTokenProgram: TOKEN_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([creator])
          .rpc();

        await confirm(provider.connection, tx);
      } catch (e) {
        expect(e.error.errorCode.code).equals("Locked");
        expect(e.error.errorCode.number).equals(6000);
        expect(e.error.errorMessage).equals("The vault is locked!");
      }
    });

    it("should let any user disburse", async () => {
      const { config, vault, vaultAta } = await getPDAs(
        program.programId,
        identifier,
        creator.publicKey,
        mint
      );

      await sleep(1000);
      const tx = await program.methods
        .disburse()
        .accounts({
          signer: randomUser.publicKey,
          creator: creator.publicKey,
          recipient: recipient.publicKey,
          solTreasury: payer.publicKey,
          config,
          vault,
          vaultAta,
          signerRewardAta: userRewardAta.address,
          recipientAta: recipientTokenAccount.address,
          mint,
          rewardTokenMint,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
          rewardTokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        // tests the disburse function with random user as signer
        .signers([randomUser])
        .rpc();

      await confirm(provider.connection, tx);

      const vaultAccount = await program.account.vault.fetch(vault);
      const userRewardAccount = await getAccount(
        provider.connection,
        userRewardAta.address,
        undefined,
        TOKEN_PROGRAM_ID
      );
      const recipientAccount = await getAccount(
        provider.connection,
        recipientTokenAccount.address,
        undefined,
        TOKEN_2022_PROGRAM_ID
      );

      expect(vaultAccount.numberOfPaymentsMade.toNumber()).gt(
        0,
        "Number of payments made failed"
      );

      expect(Number(userRewardAccount.amount) / LAMPORTS_PER_SOL).eq(
        10,
        "Creator reward amount failed - 3"
      );

      expect(Number(recipientAccount.amount)).gt(0, "Recipient amount failed");
    });
  });

  describe("Vault w/ Recipient Cancel Authority", () => {
    it("should create a vault with a recipient cancel authority", async () => {
      identifier = new anchor.BN(randomBytes(8));
      const name = getName("Vault");
      const amountToBeVested = new anchor.BN(100);
      const totalVestingDuration = new anchor.BN(10);
      const startDate = new anchor.BN(new Date().getTime() / 1000);
      const payoutInterval = new anchor.BN(5);
      const cancelAuthority = await getAuthority(Authority.Recipient, program);
      const { config, vault, vaultAta } = await getPDAs(
        program.programId,
        identifier,
        creator.publicKey,
        mint
      );

      const tx = await program.methods
        .create(
          identifier,
          name,
          amountToBeVested,
          totalVestingDuration,
          startDate,
          payoutInterval,
          cancelAuthority
        )
        .accounts({
          creator: creator.publicKey,
          recipient: recipient.publicKey,
          solTreasury: payer.publicKey,
          tokenTreasury: tokenTreasury.publicKey,
          config,
          vault,
          vaultAta,
          tokenTreasuryAta: treasuryTokenAccount.address,
          creatorAta: creatorTokenAccount.address,
          creatorRewardAta: creatorRewardAta.address,
          rewardTokenMint,
          mint,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
          rewardTokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([creator])
        .rpc();

      await confirm(provider.connection, tx);
    });

    it("should not allow the creator to cancel", async () => {
      try {
        const { vault, vaultAta } = await getPDAs(
          program.programId,
          identifier,
          creator.publicKey,
          mint
        );

        const tx = await program.methods
          .cancel()
          .accounts({
            signer: creator.publicKey,
            creator: creator.publicKey,
            recipient: recipient.publicKey,
            vault,
            vaultAta,
            creatorAta: creatorTokenAccount.address,
            mint,
            tokenProgram: TOKEN_2022_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([creator])
          .rpc();

        await confirm(provider.connection, tx);
      } catch (e) {
        expect(e.error.errorCode.code).equals("Unauthorized");
        expect(e.error.errorCode.number).equals(6001);
        expect(e.error.errorMessage).equals(
          "Not authorized to perform this action!"
        );
      }
    });

    it("should allow the recipient to cancel", async () => {
      const { vault, vaultAta } = await getPDAs(
        program.programId,
        identifier,
        creator.publicKey,
        mint
      );

      await harvestWithheldTokensToMint(
        provider.connection,
        recipient,
        mint,
        [vaultAta],
        undefined,
        TOKEN_2022_PROGRAM_ID
      );

      const tx = await program.methods
        .cancel()
        .accounts({
          signer: recipient.publicKey,
          creator: creator.publicKey,
          recipient: recipient.publicKey,
          vault,
          vaultAta,
          creatorAta: creatorTokenAccount.address,
          mint,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([recipient])
        .rpc();

      await confirm(provider.connection, tx);

      try {
        await getAccount(
          provider.connection,
          vaultAta,
          undefined,
          TOKEN_2022_PROGRAM_ID
        );
        assert.fail("Expected an error");
      } catch (e) {
        assert.typeOf(e, "Error");
      }
    });
  });

  describe("Vault w/ Creator Cancel Authority", () => {
    it("should create a vault with a creator cancel authority", async () => {
      identifier = new anchor.BN(randomBytes(8));
      const name = getName("Vault");
      const amountToBeVested = new anchor.BN(100);
      const totalVestingDuration = new anchor.BN(10);
      const startDate = new anchor.BN(new Date().getTime() / 1000);
      const payoutInterval = new anchor.BN(5);
      const cancelAuthority = await getAuthority(Authority.Creator, program);
      const { config, vault, vaultAta } = await getPDAs(
        program.programId,
        identifier,
        creator.publicKey,
        mint
      );

      const tx = await program.methods
        .create(
          identifier,
          name,
          amountToBeVested,
          totalVestingDuration,
          startDate,
          payoutInterval,
          cancelAuthority
        )
        .accounts({
          creator: creator.publicKey,
          recipient: recipient.publicKey,
          solTreasury: payer.publicKey,
          tokenTreasury: tokenTreasury.publicKey,
          config,
          vault,
          vaultAta,
          tokenTreasuryAta: treasuryTokenAccount.address,
          creatorAta: creatorTokenAccount.address,
          creatorRewardAta: creatorRewardAta.address,
          rewardTokenMint,
          mint,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
          rewardTokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([creator])
        .rpc();

      await confirm(provider.connection, tx);
    });

    it("should not allow the recipient to cancel", async () => {
      try {
        const { vault, vaultAta } = await getPDAs(
          program.programId,
          identifier,
          creator.publicKey,
          mint
        );

        const tx = await program.methods
          .cancel()
          .accounts({
            signer: recipient.publicKey,
            creator: creator.publicKey,
            recipient: recipient.publicKey,
            vault,
            vaultAta,
            creatorAta: creatorTokenAccount.address,
            mint,
            tokenProgram: TOKEN_2022_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([recipient])
          .rpc();

        await confirm(provider.connection, tx);
      } catch (e) {
        expect(e.error.errorCode.code).equals("Unauthorized");
        expect(e.error.errorCode.number).equals(6001);
        expect(e.error.errorMessage).equals(
          "Not authorized to perform this action!"
        );
      }
    });

    it("should allow the creator to cancel", async () => {
      const { vault, vaultAta } = await getPDAs(
        program.programId,
        identifier,
        creator.publicKey,
        mint
      );

      await harvestWithheldTokensToMint(
        provider.connection,
        creator,
        mint,
        [vaultAta],
        undefined,
        TOKEN_2022_PROGRAM_ID
      );

      const tx = await program.methods
        .cancel()
        .accounts({
          signer: creator.publicKey,
          creator: creator.publicKey,
          recipient: recipient.publicKey,
          vault,
          vaultAta,
          creatorAta: creatorTokenAccount.address,
          mint,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([creator])
        .rpc();

      await confirm(provider.connection, tx);

      try {
        await getAccount(
          provider.connection,
          vaultAta,
          undefined,
          TOKEN_2022_PROGRAM_ID
        );
        assert.fail("Expected an error");
      } catch (e) {
        assert.typeOf(e, "Error");
      }
    });
  });

  describe("Vault w/ Both Cancel Authority", () => {
    it("should create a vault with both update authorites", async () => {
      identifier = new anchor.BN(randomBytes(8));
      const name = getName("Vault");
      const amountToBeVested = new anchor.BN(100);
      const totalVestingDuration = new anchor.BN(10);
      const startDate = new anchor.BN(new Date().getTime() / 1000);
      const payoutInterval = new anchor.BN(5);
      const cancelAuthority = await getAuthority(Authority.Both, program);
      const { config, vault, vaultAta } = await getPDAs(
        program.programId,
        identifier,
        creator.publicKey,
        mint
      );

      const tx = await program.methods
        .create(
          identifier,
          name,
          amountToBeVested,
          totalVestingDuration,
          startDate,
          payoutInterval,
          cancelAuthority
        )
        .accounts({
          creator: creator.publicKey,
          recipient: recipient.publicKey,
          solTreasury: payer.publicKey,
          tokenTreasury: tokenTreasury.publicKey,
          config,
          vault,
          vaultAta,
          tokenTreasuryAta: treasuryTokenAccount.address,
          creatorAta: creatorTokenAccount.address,
          creatorRewardAta: creatorRewardAta.address,
          rewardTokenMint,
          mint,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
          rewardTokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([creator])
        .rpc();

      await confirm(provider.connection, tx);
    });

    it("should allow the recipient to cancel", async () => {
      const { vault, vaultAta } = await getPDAs(
        program.programId,
        identifier,
        creator.publicKey,
        mint
      );

      await harvestWithheldTokensToMint(
        provider.connection,
        recipient,
        mint,
        [vaultAta],
        undefined,
        TOKEN_2022_PROGRAM_ID
      );

      const tx = await program.methods
        .cancel()
        .accounts({
          signer: recipient.publicKey,
          creator: creator.publicKey,
          recipient: recipient.publicKey,
          vault,
          vaultAta,
          creatorAta: creatorTokenAccount.address,
          mint,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([recipient])
        .rpc();

      await confirm(provider.connection, tx);

      try {
        await getAccount(
          provider.connection,
          vaultAta,
          undefined,
          TOKEN_2022_PROGRAM_ID
        );
        assert.fail("Expected an error");
      } catch (e) {
        assert.typeOf(e, "Error");
      }
    });

    it("should create another vault with both update authorites", async () => {
      identifier = new anchor.BN(randomBytes(8));
      const name = getName("Vault");
      const amountToBeVested = new anchor.BN(100);
      const totalVestingDuration = new anchor.BN(10);
      const startDate = new anchor.BN(new Date().getTime() / 1000);
      const payoutInterval = new anchor.BN(5);
      const cancelAuthority = await getAuthority(Authority.Both, program);
      const { config, vault, vaultAta } = await getPDAs(
        program.programId,
        identifier,
        creator.publicKey,
        mint
      );

      const tx = await program.methods
        .create(
          identifier,
          name,
          amountToBeVested,
          totalVestingDuration,
          startDate,
          payoutInterval,
          cancelAuthority
        )
        .accounts({
          creator: creator.publicKey,
          recipient: recipient.publicKey,
          solTreasury: payer.publicKey,
          tokenTreasury: tokenTreasury.publicKey,
          config,
          vault,
          vaultAta,
          tokenTreasuryAta: treasuryTokenAccount.address,
          creatorAta: creatorTokenAccount.address,
          creatorRewardAta: creatorRewardAta.address,
          rewardTokenMint,
          mint,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
          rewardTokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([creator])
        .rpc();

      await confirm(provider.connection, tx);
    });

    it("should allow cancel if creator", async () => {
      const { vault, vaultAta } = await getPDAs(
        program.programId,
        identifier,
        creator.publicKey,
        mint
      );

      await harvestWithheldTokensToMint(
        provider.connection,
        creator,
        mint,
        [vaultAta],
        undefined,
        TOKEN_2022_PROGRAM_ID
      );

      const tx = await program.methods
        .cancel()
        .accounts({
          signer: creator.publicKey,
          creator: creator.publicKey,
          recipient: recipient.publicKey,
          vault,
          vaultAta,
          creatorAta: creatorTokenAccount.address,
          mint,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([creator])
        .rpc();

      await confirm(provider.connection, tx);

      try {
        await getAccount(
          provider.connection,
          vaultAta,
          undefined,
          TOKEN_2022_PROGRAM_ID
        );
        assert.fail("Expected an error");
      } catch (e) {
        assert.typeOf(e, "Error");
      }
    });
  });

  describe("Vault w/ Disburse and Close", () => {
    it("should not close a vault that is not empty", async () => {
      identifier = new anchor.BN(randomBytes(8));
      const name = getName("Vault");
      const amountToBeVested = new anchor.BN(100);
      const totalVestingDuration = new anchor.BN(10);
      const startDate = new anchor.BN(new Date().getTime() / 1000);
      const payoutInterval = new anchor.BN(1);
      const cancelAuthority = await getAuthority(Authority.Both, program);
      const { config, vault, vaultAta } = await getPDAs(
        program.programId,
        identifier,
        creator.publicKey,
        mint
      );

      let tx = await program.methods
        .create(
          identifier,
          name,
          amountToBeVested,
          totalVestingDuration,
          startDate,
          payoutInterval,
          cancelAuthority
        )
        .accounts({
          creator: creator.publicKey,
          recipient: recipient.publicKey,
          solTreasury: payer.publicKey,
          tokenTreasury: tokenTreasury.publicKey,
          config,
          vault,
          vaultAta,
          tokenTreasuryAta: treasuryTokenAccount.address,
          creatorAta: creatorTokenAccount.address,
          creatorRewardAta: creatorRewardAta.address,
          rewardTokenMint,
          mint,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
          rewardTokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([creator])
        .rpc();

      await confirm(provider.connection, tx);

      try {
        await sleep(1000);
        tx = await program.methods
          .close()
          .accounts({
            creator: creator.publicKey,
            vault,
            vaultAta,
            mint,
            tokenProgram: TOKEN_2022_PROGRAM_ID,
          })
          .signers([creator])
          .rpc();

        await confirm(provider.connection, tx);
      } catch (e) {
        expect(e.error.errorCode.code).equals("CloseVaultFailed");
        expect(e.error.errorCode.number).equals(6004);
        expect(e.error.errorMessage).equals("Closing the vault failed!");
      }
    });

    it("should close a vault that is empty", async () => {
      identifier = new anchor.BN(randomBytes(8));
      const name = getName("Vault");
      const amountToBeVested = new anchor.BN(100);
      const totalVestingDuration = new anchor.BN(1);
      const startDate = new anchor.BN(new Date().getTime() / 1000);
      const payoutInterval = new anchor.BN(1);
      const cancelAuthority = await getAuthority(Authority.Both, program);
      const { config, vault, vaultAta } = await getPDAs(
        program.programId,
        identifier,
        creator.publicKey,
        mint
      );

      let tx = await program.methods
        .create(
          identifier,
          name,
          amountToBeVested,
          totalVestingDuration,
          startDate,
          payoutInterval,
          cancelAuthority
        )
        .accounts({
          creator: creator.publicKey,
          recipient: recipient.publicKey,
          solTreasury: payer.publicKey,
          tokenTreasury: tokenTreasury.publicKey,
          config,
          vault,
          vaultAta,
          tokenTreasuryAta: treasuryTokenAccount.address,
          creatorAta: creatorTokenAccount.address,
          creatorRewardAta: creatorRewardAta.address,
          rewardTokenMint,
          mint,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
          rewardTokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([creator])
        .rpc();

      await confirm(provider.connection, tx);

      await sleep(1000);
      tx = await program.methods
        .disburse()
        .accounts({
          signer: creator.publicKey,
          creator: creator.publicKey,
          recipient: recipient.publicKey,
          solTreasury: payer.publicKey,
          config,
          vault,
          vaultAta,
          signerRewardAta: creatorRewardAta.address,
          recipientAta: recipientTokenAccount.address,
          mint,
          rewardTokenMint,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
          rewardTokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([creator])
        .rpc();

      await confirm(provider.connection, tx);

      await harvestWithheldTokensToMint(
        provider.connection,
        creator,
        mint,
        [vaultAta],
        undefined,
        TOKEN_2022_PROGRAM_ID
      );

      tx = await program.methods
        .close()
        .accounts({
          creator: creator.publicKey,
          vault,
          vaultAta,
          mint,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
        })
        .signers([creator])
        .rpc();

      await confirm(provider.connection, tx);

      try {
        await getAccount(
          provider.connection,
          vaultAta,
          undefined,
          TOKEN_2022_PROGRAM_ID
        );
        assert.fail("Expected an error");
      } catch (e) {
        assert.typeOf(e, "Error");
      }
    });
  });
});
