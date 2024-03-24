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
  PublicKey,
  SYSVAR_INSTRUCTIONS_PUBKEY,
} from "@solana/web3.js";

import { MPL_TOKEN_METADATA_PROGRAM_ID } from "@metaplex-foundation/mpl-token-metadata";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
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

  beforeAll(async () => {
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
  }, 30000);

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
        expect(true).toBe(false);
      } catch (e) {
        expect(e.error.errorCode.code).toStrictEqual(
          "InvalidTokenFeeBasisPoints"
        );
        expect(e.error.errorCode.number).toStrictEqual(6005);
        expect(e.error.errorMessage).toStrictEqual(
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

      expect(configAccount.admin.toString()).toStrictEqual(
        payer.publicKey.toString()
      );
      expect(configAccount.devTreasury.toString()).toStrictEqual(
        payer.publicKey.toString()
      );
      expect(configAccount.daoTreasury.toString()).toStrictEqual(
        daoTreasury.publicKey.toString()
      );
      expect(configAccount.devFee.toString()).toStrictEqual(devFee.toString());
      expect(configAccount.tokenFeeBasisPoints.toString()).toStrictEqual(
        tokenFeeBasisPoints.toString()
      );
      expect(configAccount.governanceTokenAmount.toString()).toStrictEqual(
        governanceTokenAmount.toString()
      );
      expect(configAccount.governanceTokenMintKey.toString()).toStrictEqual(
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
        expect(true).toBe(false);
      } catch (e) {
        expect(e.logs[3].includes("already in use")).toStrictEqual(true);
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

      expect(receiverAccount.amount.toString()).toStrictEqual(
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
        expect(true).toBe(false);
      } catch (e) {
        expect(e.error.errorCode.code).toStrictEqual("ConstraintHasOne");
        expect(e.error.errorCode.number).toStrictEqual(2001);
        expect(e.error.errorMessage).toStrictEqual(
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
      expect(configAccount.admin.toString()).toStrictEqual(
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
      expect(configAccount.admin.toString()).toStrictEqual(
        payer.publicKey.toString()
      );
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
      expect(configAccount.daoTreasury.toString()).toStrictEqual(
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
      expect(configAccount.daoTreasury.toString()).toStrictEqual(
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
      expect(configAccount.devFee.toString()).toStrictEqual(
        newDevFee.toString()
      );
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
      expect(configAccount.governanceTokenAmount.toString()).toStrictEqual(
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
      expect(configAccount.tokenFeeBasisPoints.toString()).toStrictEqual(
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

      expect(treasuryAtaBefore.amount).toStrictEqual(0n);

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

      expect(vaultAccount.identifier.toString()).toStrictEqual(
        identifier.toString()
      );
      expect(vaultAccount.creator.toString()).toStrictEqual(
        creator.publicKey.toString()
      );
      expect(vaultAccount.recipient.toString()).toStrictEqual(
        recipient.publicKey.toString()
      );
      expect(vaultAccount.mint.toString()).toStrictEqual(mint.toString());
      expect(vaultAccount.totalVestingDuration.toString()).toStrictEqual(
        totalVestingDuration.toString()
      );
      expect(vaultAccount.startDate.toString()).toStrictEqual(
        startDate.toString()
      );
      expect(vaultAccount.payoutInterval.toString()).toStrictEqual(
        payoutInterval.toString()
      );
      expect(vaultAccount.numberOfPaymentsMade.toString()).toStrictEqual(
        Number(0).toString()
      );
      expect(vaultAccount.cancelAuthority.toString()).toStrictEqual(
        cancelAuthority.toString()
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

      expect(devTreasuryBalanceAfter).toBeGreaterThan(devTreasuryBalanceBefore);

      expect(Number(treasuryAtaAfter.amount)).toBeGreaterThan(
        Number(treasuryAtaBefore.amount)
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
        expect(true).toBe(false);
      } catch (e) {
        expect(e.error.errorCode.code).toStrictEqual("Unauthorized");
        expect(e.error.errorCode.number).toStrictEqual(6001);
        expect(e.error.errorMessage).toStrictEqual(
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
        expect(e.error.errorCode.code).toStrictEqual("Locked");
        expect(e.error.errorCode.number).toStrictEqual(6000);
        expect(e.error.errorMessage).toStrictEqual("The vault is locked!");
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

      expect(vaultAccount.numberOfPaymentsMade.toNumber()).toBeGreaterThan(0);

      expect(Number(recipientAccount.amount)).toBeGreaterThan(0);
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
        expect(e.error.errorCode.code).toStrictEqual("Unauthorized");
        expect(e.error.errorCode.number).toStrictEqual(6001);
        expect(e.error.errorMessage).toStrictEqual(
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
        expect(true).toBe(false);
      } catch (e) {
        expect(e).toBeDefined();
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
        expect(e.error.errorCode.code).toStrictEqual("Unauthorized");
        expect(e.error.errorCode.number).toStrictEqual(6001);
        expect(e.error.errorMessage).toStrictEqual(
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
        expect(true).toBe(false);
      } catch (e) {
        expect(e).toBeDefined();
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
        expect(true).toBe(false);
      } catch (e) {
        expect(e).toBeDefined();
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
        expect(true).toBe(false);
      } catch (e) {
        expect(e).toBeDefined();
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
        expect(e.error.errorCode.code).toStrictEqual("Locked");
        expect(e.error.errorCode.number).toStrictEqual(6000);
        expect(e.error.errorMessage).toStrictEqual("The vault is locked!");
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

      await sleep(3000);
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
        expect(true).toBe(false);
      } catch (e) {
        expect(e).toBeDefined();
      }
    });
  });
});
