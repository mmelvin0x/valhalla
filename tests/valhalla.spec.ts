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
import {
  Keypair,
  LAMPORTS_PER_SOL,
  SYSVAR_INSTRUCTIONS_PUBKEY,
} from "@solana/web3.js";
import { assert, expect } from "chai";

import { MPL_TOKEN_METADATA_PROGRAM_ID } from "@metaplex-foundation/mpl-token-metadata";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import { PublicKey } from "@metaplex-foundation/js";
import { Valhalla } from "../target/types/valhalla";
import { airdrop } from "./utils/airdrop";
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
  const daoTreasury = Keypair.generate();

  let identifier: anchor.BN;
  let mint: PublicKey;
  let creatorTokenAccount: Account;
  let recipientTokenAccount: Account;
  let treasuryTokenAccount: Account;
  let creatorGovernanceAta: Account;
  let userRewardAta: Account;
  let governanceTokenMint: PublicKey;
  let metadata;

  before(async () => {
    governanceTokenMint = PublicKey.findProgramAddressSync(
      [Buffer.from("governance_token_mint")],
      program.programId
    )[0];

    metadata = PublicKey.findProgramAddressSync(
      [
        Buffer.from("metadata"),
        new PublicKey(MPL_TOKEN_METADATA_PROGRAM_ID).toBuffer(),
        new PublicKey(governanceTokenMint).toBuffer(),
      ],
      new PublicKey(MPL_TOKEN_METADATA_PROGRAM_ID)
    )[0];

    [mint, creatorTokenAccount, recipientTokenAccount, treasuryTokenAccount] =
      await setupTestAccounts(
        provider,
        payer,
        creator,
        recipient,
        randomUser,
        daoTreasury
      );
  });

  describe("Create Config", () => {
    it("should fail if the token fee basis points are greater than 10000", async () => {
      try {
        const { config } = await getPDAs(program.programId);
        const tx = await program.methods
          .createConfig(
            "Odin",
            "ODIN",
            "https://test.com",
            9,
            new anchor.BN(0.025 * LAMPORTS_PER_SOL),
            new anchor.BN(5),
            new anchor.BN(10001),
            new anchor.BN(0.01 * LAMPORTS_PER_SOL)
          )
          .accounts({
            admin: payer.publicKey,
            config,
            metadata,
            devTreasury: payer.publicKey,
            daoTreasury: daoTreasury.publicKey,
            governanceTokenMint,
            tokenProgram: TOKEN_PROGRAM_ID,
            sysvarInstruction: SYSVAR_INSTRUCTIONS_PUBKEY,
            tokenMetadataProgram: MPL_TOKEN_METADATA_PROGRAM_ID,
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
      const devFee = new anchor.BN(0.025 * LAMPORTS_PER_SOL);
      const autopayMultiplier = new anchor.BN(5);
      const tokenFeeBasisPoints = new anchor.BN(10);
      const governanceTokenAmount = new anchor.BN(10 * LAMPORTS_PER_SOL);

      try {
        const tx = await program.methods
          .createConfig(
            "Odin",
            "ODIN",
            "https://test.com",
            9,
            devFee,
            autopayMultiplier,
            tokenFeeBasisPoints,
            governanceTokenAmount
          )
          .accounts({
            admin: payer.publicKey,
            config,
            metadata,
            devTreasury: payer.publicKey,
            daoTreasury: daoTreasury.publicKey,
            governanceTokenMint,
            tokenProgram: TOKEN_PROGRAM_ID,
            sysvarInstruction: SYSVAR_INSTRUCTIONS_PUBKEY,
            tokenMetadataProgram: MPL_TOKEN_METADATA_PROGRAM_ID,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([])
          .rpc();

        await confirm(provider.connection, tx);
      } catch (e) {
        console.error(e);
      }

      const configAccount = await program.account.config.fetch(config);

      expect(configAccount.admin.toString()).equals(payer.publicKey.toString());
      expect(configAccount.devTreasury.toString()).equals(
        payer.publicKey.toString()
      );
      expect(configAccount.daoTreasury.toString()).equals(
        daoTreasury.publicKey.toString()
      );
      expect(configAccount.devFee.toString()).equals(devFee.toString());
      expect(configAccount.tokenFeeBasisPoints.toString()).equals(
        tokenFeeBasisPoints.toString()
      );
      expect(configAccount.governanceTokenAmount.toString()).equals(
        governanceTokenAmount.toString()
      );
      expect(configAccount.governanceTokenMintKey.toString()).equals(
        governanceTokenMint.toString()
      );

      // Define these now that the reward token mint is created
      creatorGovernanceAta = await getOrCreateAssociatedTokenAccount(
        provider.connection,
        creator,
        governanceTokenMint,
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
        governanceTokenMint,
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
            "Odin",
            "ODIN",
            "https://test.com",
            9,
            new anchor.BN(0.025 * LAMPORTS_PER_SOL),
            new anchor.BN(5),
            new anchor.BN(10),
            new anchor.BN(10 * LAMPORTS_PER_SOL)
          )
          .accounts({
            admin: payer.publicKey,
            config,
            metadata,
            devTreasury: payer.publicKey,
            daoTreasury: daoTreasury.publicKey,
            governanceTokenMint,
            tokenProgram: TOKEN_PROGRAM_ID,
            sysvarInstruction: SYSVAR_INSTRUCTIONS_PUBKEY,
            tokenMetadataProgram: MPL_TOKEN_METADATA_PROGRAM_ID,
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

    it("should let the admin mint governance tokens", async () => {
      const receiverTokenAccount = await getOrCreateAssociatedTokenAccount(
        provider.connection,
        payer,
        governanceTokenMint,
        payer.publicKey,
        false,
        undefined,
        undefined,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );

      const { config } = await getPDAs(program.programId);
      const tx = await program.methods
        .mintGovernanceTokens(new anchor.BN(10 * LAMPORTS_PER_SOL))
        .accounts({
          admin: payer.publicKey,
          receiver: payer.publicKey,
          config,
          governanceTokenMint,
          receiverTokenAccount: receiverTokenAccount.address,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([payer])
        .rpc();

      await confirm(provider.connection, tx);

      const receiverAccount = await getAccount(
        provider.connection,
        receiverTokenAccount.address,
        undefined,
        TOKEN_PROGRAM_ID
      );

      expect(receiverAccount.amount.toString()).equals(
        (10 * LAMPORTS_PER_SOL).toString()
      );
    });

    it("should not let a non-admin mint governance tokens", async () => {
      try {
        const receiverTokenAccount = await getOrCreateAssociatedTokenAccount(
          provider.connection,
          payer,
          governanceTokenMint,
          payer.publicKey,
          false,
          undefined,
          undefined,
          TOKEN_PROGRAM_ID,
          ASSOCIATED_TOKEN_PROGRAM_ID
        );

        const { config } = await getPDAs(program.programId);
        const tx = await program.methods
          .mintGovernanceTokens(new anchor.BN(10 * LAMPORTS_PER_SOL))
          .accounts({
            admin: creator.publicKey,
            receiver: payer.publicKey,
            config,
            governanceTokenMint,
            receiverTokenAccount: receiverTokenAccount.address,
            tokenProgram: TOKEN_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([creator])
          .rpc();

        await confirm(provider.connection, tx);
        assert.fail("Expected an error");
      } catch (e) {
        expect(e.error.errorCode.code).equals("ConstraintHasOne");
        expect(e.error.errorCode.number).equals(2001);
        expect(e.error.errorMessage).equals(
          "A has one constraint was violated"
        );
      }
    });
  });

  describe("Update Config", () => {
    it("should update the admin", async () => {
      const { config } = await getPDAs(program.programId);
      const newAdmin = Keypair.generate();

      let tx = await program.methods
        .updateAdmin()
        .accounts({
          admin: payer.publicKey,
          newAdmin: newAdmin.publicKey,
          config,
        })
        .signers([payer])
        .rpc();

      await confirm(provider.connection, tx);

      let configAccount = await program.account.config.fetch(config);
      expect(configAccount.admin.toString()).equals(
        newAdmin.publicKey.toString()
      );

      await airdrop(provider.connection, newAdmin.publicKey);

      tx = await program.methods
        .updateAdmin()
        .accounts({
          admin: newAdmin.publicKey,
          newAdmin: payer.publicKey,
          config,
        })
        .signers([newAdmin])
        .rpc();

      await confirm(provider.connection, tx);

      configAccount = await program.account.config.fetch(config);
      expect(configAccount.admin.toString()).equals(payer.publicKey.toString());
    });

    it("should update the dao treasury", async () => {
      const { config } = await getPDAs(program.programId);
      const newDaoTreasury = Keypair.generate();

      let tx = await program.methods
        .updateDaoTreasury()
        .accounts({
          admin: payer.publicKey,
          newDaoTreasury: newDaoTreasury.publicKey,
          config,
        })
        .signers([payer])
        .rpc();

      await confirm(provider.connection, tx);

      let configAccount = await program.account.config.fetch(config);
      expect(configAccount.daoTreasury.toString()).equals(
        newDaoTreasury.publicKey.toString()
      );

      await airdrop(provider.connection, newDaoTreasury.publicKey);

      tx = await program.methods
        .updateDaoTreasury()
        .accounts({
          admin: payer.publicKey,
          newDaoTreasury: payer.publicKey,
          config,
        })
        .signers([payer])
        .rpc();

      await confirm(provider.connection, tx);

      configAccount = await program.account.config.fetch(config);
      expect(configAccount.daoTreasury.toString()).equals(
        payer.publicKey.toString()
      );
    });

    it("should update the dev fee", async () => {
      const { config } = await getPDAs(program.programId);
      const newDevFee = new anchor.BN(0.05 * LAMPORTS_PER_SOL);

      const tx = await program.methods
        .updateDevFee(newDevFee)
        .accounts({
          admin: payer.publicKey,
          config,
        })
        .signers([payer])
        .rpc();

      await confirm(provider.connection, tx);

      const configAccount = await program.account.config.fetch(config);
      expect(configAccount.devFee.toString()).equals(newDevFee.toString());
    });

    it("should update the governance token amount", async () => {
      const { config } = await getPDAs(program.programId);
      const newGovernanceTokenAmount = new anchor.BN(20 * LAMPORTS_PER_SOL);

      const tx = await program.methods
        .updateGovernanceTokenAmount(newGovernanceTokenAmount)
        .accounts({
          admin: payer.publicKey,
          config,
        })
        .signers([payer])
        .rpc();

      await confirm(provider.connection, tx);

      const configAccount = await program.account.config.fetch(config);
      expect(configAccount.governanceTokenAmount.toString()).equals(
        newGovernanceTokenAmount.toString()
      );
    });

    it("should update the token fee basis points", async () => {
      const { config } = await getPDAs(program.programId);
      const newTokenFeeBasisPoints = new anchor.BN(100);

      const tx = await program.methods
        .updateTokenFeeBasisPoints(newTokenFeeBasisPoints)
        .accounts({
          admin: payer.publicKey,
          config,
        })
        .signers([payer])
        .rpc();

      await confirm(provider.connection, tx);

      const configAccount = await program.account.config.fetch(config);
      expect(configAccount.tokenFeeBasisPoints.toString()).equals(
        newTokenFeeBasisPoints.toString()
      );
    });
  });

  describe("Vault w/ Neither Cancel Authority", () => {
    it("should create a vault", async () => {
      identifier = new anchor.BN(randomBytes(8));
      const name = getName("Vault");
      const autopay = false;
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

      const devTreasuryBalanceBefore = await provider.connection.getBalance(
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
          devTreasury: payer.publicKey,
          daoTreasury: daoTreasury.publicKey,
          config,
          vault,
          vaultAta,
          daoTreasuryAta: treasuryTokenAccount.address,
          creatorAta: creatorTokenAccount.address,
          mint,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([creator])
        .rpc();

      await confirm(provider.connection, tx);

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

      const devTreasuryBalanceAfter = await provider.connection.getBalance(
        payer.publicKey
      );

      const treasuryAtaAfter = await getAccount(
        provider.connection,
        treasuryTokenAccount.address,
        undefined,
        TOKEN_2022_PROGRAM_ID
      );

      expect(devTreasuryBalanceAfter).gt(
        devTreasuryBalanceBefore,
        "Sol treasury balance failed"
      );

      expect(Number(treasuryAtaAfter.amount)).gt(
        Number(treasuryAtaBefore.amount),
        "Token treasury amount failed - 2"
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
            devTreasury: payer.publicKey,
            config,
            vault,
            vaultAta,
            signerGovernanceAta: creatorGovernanceAta.address,
            recipientAta: recipientTokenAccount.address,
            mint,
            governanceTokenMint,
            tokenProgram: TOKEN_2022_PROGRAM_ID,
            governanceTokenProgram: TOKEN_PROGRAM_ID,
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

      await sleep(2000);
      const tx = await program.methods
        .disburse()
        .accounts({
          signer: randomUser.publicKey,
          creator: creator.publicKey,
          recipient: recipient.publicKey,
          devTreasury: payer.publicKey,
          config,
          vault,
          vaultAta,
          signerGovernanceAta: userRewardAta.address,
          recipientAta: recipientTokenAccount.address,
          mint,
          governanceTokenMint,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
          governanceTokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        // tests the disburse function with random user as signer
        .signers([randomUser])
        .rpc();

      await confirm(provider.connection, tx);

      const vaultAccount = await program.account.vault.fetch(vault);
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

      expect(Number(recipientAccount.amount)).gt(0, "Recipient amount failed");
    });
  });

  describe("Vault w/ Recipient Cancel Authority", () => {
    it("should create a vault with a recipient cancel authority", async () => {
      identifier = new anchor.BN(randomBytes(8));
      const name = getName("Vault");
      const autopay = true;
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
          cancelAuthority,
          autopay
        )
        .accounts({
          creator: creator.publicKey,
          recipient: recipient.publicKey,
          devTreasury: payer.publicKey,
          daoTreasury: daoTreasury.publicKey,
          config,
          vault,
          vaultAta,
          daoTreasuryAta: treasuryTokenAccount.address,
          creatorAta: creatorTokenAccount.address,
          mint,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
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
      const autopay = false;
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
          cancelAuthority,
          autopay
        )
        .accounts({
          creator: creator.publicKey,
          recipient: recipient.publicKey,
          devTreasury: payer.publicKey,
          daoTreasury: daoTreasury.publicKey,
          config,
          vault,
          vaultAta,
          daoTreasuryAta: treasuryTokenAccount.address,
          creatorAta: creatorTokenAccount.address,
          mint,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
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
      const autopay = true;
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
          cancelAuthority,
          autopay
        )
        .accounts({
          creator: creator.publicKey,
          recipient: recipient.publicKey,
          devTreasury: payer.publicKey,
          daoTreasury: daoTreasury.publicKey,
          config,
          vault,
          vaultAta,
          daoTreasuryAta: treasuryTokenAccount.address,
          creatorAta: creatorTokenAccount.address,
          mint,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
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
      const autopay = false;
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
          cancelAuthority,
          autopay
        )
        .accounts({
          creator: creator.publicKey,
          recipient: recipient.publicKey,
          devTreasury: payer.publicKey,
          daoTreasury: daoTreasury.publicKey,
          config,
          vault,
          vaultAta,
          daoTreasuryAta: treasuryTokenAccount.address,
          creatorAta: creatorTokenAccount.address,
          mint,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
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
    it("should not close a vault that is not expired", async () => {
      identifier = new anchor.BN(randomBytes(8));
      const name = getName("Vault");
      const autopay = true;
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
          cancelAuthority,
          autopay
        )
        .accounts({
          creator: creator.publicKey,
          recipient: recipient.publicKey,
          devTreasury: payer.publicKey,
          daoTreasury: daoTreasury.publicKey,
          config,
          vault,
          vaultAta,
          daoTreasuryAta: treasuryTokenAccount.address,
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
        expect(e.error.errorCode.code).equals("Locked");
        expect(e.error.errorCode.number).equals(6000);
        expect(e.error.errorMessage).equals("The vault is locked!");
      }
    });

    it("should close a vault that is empty", async () => {
      identifier = new anchor.BN(randomBytes(8));
      const name = getName("Vault");
      const autopay = false;
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
          cancelAuthority,
          autopay
        )
        .accounts({
          creator: creator.publicKey,
          recipient: recipient.publicKey,
          devTreasury: payer.publicKey,
          daoTreasury: daoTreasury.publicKey,
          config,
          vault,
          vaultAta,
          daoTreasuryAta: treasuryTokenAccount.address,
          creatorAta: creatorTokenAccount.address,
          mint,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
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
          devTreasury: payer.publicKey,
          config,
          vault,
          vaultAta,
          signerGovernanceAta: creatorGovernanceAta.address,
          recipientAta: recipientTokenAccount.address,
          mint,
          governanceTokenMint,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
          governanceTokenProgram: TOKEN_PROGRAM_ID,
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
