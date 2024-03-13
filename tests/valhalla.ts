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
import { Connection, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { ValhallaPDAs, getPDAs } from "./utils/getPDAs";
import { assert, expect } from "chai";

import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import { Valhalla } from "../target/types/valhalla";
import { VestingType } from "../app/src/program";
import { mintTransferFeeTokens } from "./utils/mintTransferFeeTokens";
import { randomBytes } from "crypto";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const confirm = async (
  connection: Connection,
  signature: string
): Promise<string> => {
  const block = await connection.getLatestBlockhash();
  await connection.confirmTransaction({
    signature,
    ...block,
  });

  return signature;
};

const getName = (name: string) => {
  const nameArg = [];
  const name_ = anchor.utils.bytes.utf8.encode(name);
  name_.forEach((byte, i) => {
    if (i < 32) {
      nameArg.push(byte);
    }
  });

  return nameArg;
};

const getNowInSeconds = () => new anchor.BN(Date.now() / 1000);

const getAuthority = (
  authority: Authority,
  program: anchor.Program<Valhalla>
) =>
  program.coder.types.decode("Authority", new anchor.BN(authority).toBuffer());

describe("⚡️ Valhalla", () => {
  const provider = anchor.AnchorProvider.env();
  const wallet = provider.wallet as NodeWallet;
  const payer = (wallet as NodeWallet).payer;
  anchor.setProvider(provider);

  const program = anchor.workspace.Valhalla as anchor.Program<Valhalla>;

  const creator = anchor.web3.Keypair.generate();
  const recipient = anchor.web3.Keypair.generate();

  let identifier: anchor.BN;
  let mint: anchor.web3.PublicKey;
  let creatorTokenAccount: Account;
  let recipientTokenAccount: Account;

  before(async () => {
    [mint, creatorTokenAccount, recipientTokenAccount] =
      await setupTestAccounts(provider, payer, creator, recipient);
  });

  describe("Create Config", () => {
    it("should create a config", async () => {
      const { config } = getPDAs(program.programId);

      const tx = await program.methods
        .createConfig(new anchor.BN(0.1 * LAMPORTS_PER_SOL))
        .accounts({
          admin: wallet.publicKey,
          config,
          treasury: wallet.publicKey,
        })
        .signers([payer])
        .rpc();

      await confirm(provider.connection, tx);

      const lockerAccount = await program.account.config.fetch(config);
      expect(lockerAccount.fee.toNumber()).equals(0.1 * LAMPORTS_PER_SOL);
    });
  });

  describe("Update Config", () => {
    it("should update the config fee", async () => {
      const { config } = getPDAs(program.programId);

      let tx = await program.methods
        .updateConfig(new anchor.BN(0.2 * LAMPORTS_PER_SOL))
        .accounts({
          admin: wallet.publicKey,
          newAdmin: wallet.publicKey,
          config,
          treasury: wallet.publicKey,
          newTreasury: wallet.publicKey,
        })
        .signers([payer])
        .rpc();

      await confirm(provider.connection, tx);

      const lockerAccount = await program.account.config.fetch(config);
      expect(lockerAccount.fee.toNumber()).equals(0.2 * LAMPORTS_PER_SOL);

      tx = await program.methods
        .updateConfig(new anchor.BN(0.1 * LAMPORTS_PER_SOL))
        .accounts({
          admin: wallet.publicKey,
          newAdmin: wallet.publicKey,
          config: config,
          treasury: wallet.publicKey,
          newTreasury: wallet.publicKey,
        })
        .signers([payer])
        .rpc();

      await confirm(provider.connection, tx);

      const lockerAccount_ = await program.account.config.fetch(config);
      expect(lockerAccount_.fee.toNumber()).equals(0.1 * LAMPORTS_PER_SOL);
    });

    it("should not allow a non-admin to update the config fee", async () => {
      try {
        const { config } = getPDAs(program.programId);

        await program.methods
          .updateConfig(new anchor.BN(0.2 * LAMPORTS_PER_SOL))
          .accounts({
            admin: wallet.publicKey,
            newAdmin: wallet.publicKey,
            config,
            treasury: wallet.publicKey,
            newTreasury: wallet.publicKey,
          })
          .signers([recipient]).rpc;
      } catch (e) {
        expect(e.message).equals(
          `unknown signer: ${recipient.publicKey.toBase58()}`
        );
      }
    });

    it("should update the config treasury", async () => {
      let lockerAccount;
      const newTreasury = Keypair.generate().publicKey;
      const { config } = getPDAs(program.programId);

      let tx = await program.methods
        .updateConfig(new anchor.BN(0.1 * LAMPORTS_PER_SOL))
        .accounts({
          admin: wallet.publicKey,
          newAdmin: wallet.publicKey,
          config,
          treasury: wallet.publicKey,
          newTreasury,
        })
        .signers([payer])
        .rpc();

      await confirm(provider.connection, tx);

      lockerAccount = await program.account.config.fetch(config);
      expect(lockerAccount.treasury.toBase58()).equals(newTreasury.toBase58());

      tx = await program.methods
        .updateConfig(new anchor.BN(0.1 * LAMPORTS_PER_SOL))
        .accounts({
          admin: wallet.publicKey,
          newAdmin: wallet.publicKey,
          config,
          treasury: newTreasury,
          newTreasury: wallet.publicKey,
        })
        .signers([payer])
        .rpc();

      await confirm(provider.connection, tx);

      lockerAccount = await program.account.config.fetch(config);
      expect(lockerAccount.treasury.toBase58()).equals(
        wallet.publicKey.toBase58()
      );
    });

    it("should not allow a non-admin to update the config treasury", async () => {
      try {
        const newTreasury = Keypair.generate().publicKey;
        const { config } = getPDAs(program.programId);

        await provider.connection,
          program.methods
            .updateConfig(new anchor.BN(0.1 * LAMPORTS_PER_SOL))
            .accounts({
              admin: wallet.publicKey,
              newAdmin: wallet.publicKey,
              config,
              treasury: wallet.publicKey,
              newTreasury,
            })
            .signers([creator]).rpc;
      } catch (e) {
        expect(e.message).equals(
          `unknown signer: ${creator.publicKey.toBase58()}`
        );
      }
    });

    it("should update the config admin", async () => {
      const { config } = getPDAs(program.programId);
      let lockerAccount = await program.account.config.fetch(config);
      const newAdmin = Keypair.generate();

      let tx = await program.methods
        .updateConfig(new anchor.BN(0.1 * LAMPORTS_PER_SOL))
        .accounts({
          admin: wallet.publicKey,
          newAdmin: newAdmin.publicKey,
          config,
          treasury: wallet.publicKey,
          newTreasury: wallet.publicKey,
        })
        .signers([payer])
        .rpc();

      await confirm(provider.connection, tx);

      lockerAccount = await program.account.config.fetch(config);
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
        .updateConfig(new anchor.BN(0.1 * LAMPORTS_PER_SOL))
        .accounts({
          admin: newAdmin.publicKey,
          newAdmin: wallet.publicKey,
          config,
          treasury: wallet.publicKey,
          newTreasury: wallet.publicKey,
        })
        .signers([newAdmin])
        .rpc();

      await confirm(provider.connection, tx);

      lockerAccount = await program.account.config.fetch(config);
      expect(lockerAccount.treasury.toBase58()).equals(
        wallet.publicKey.toBase58()
      );
    });

    it("should not allow a non-admin to update the config admin", async () => {
      try {
        const newAdmin = Keypair.generate();
        const { config } = getPDAs(program.programId);

        await program.methods
          .updateConfig(new anchor.BN(0.1 * LAMPORTS_PER_SOL))
          .accounts({
            admin: wallet.publicKey,
            newAdmin: newAdmin.publicKey,
            config,
            treasury: wallet.publicKey,
            newTreasury: wallet.publicKey,
          })
          .signers([creator]).rpc;
      } catch (e) {
        expect(e.message).equals(
          `unknown signer: ${creator.publicKey.toBase58()}`
        );
      }
    });
  });

  describe("Simple Vault - No schedule, no cancel, no update", () => {
    it("should create a vault", async () => {
      identifier = new anchor.BN(randomBytes(8));
      const name = getName("Simple Vault");
      const amountToBeVested = new anchor.BN(1000);
      const totalVestingDuration = new anchor.BN(10);
      const cancelAuthority = getAuthority(Authority.Neither, program);
      const changeRecipientAuthority = getAuthority(Authority.Neither, program);
      const payoutInterval = new anchor.BN(0);
      const startDate = getNowInSeconds();
      const { config, vault, vaultAta, tokenAccountBump } = getPDAs(
        program.programId,
        identifier,
        creator.publicKey,
        recipient.publicKey,
        mint
      );

      try {
        const tx = await program.methods
          .create(
            identifier,
            name,
            amountToBeVested,
            totalVestingDuration,
            cancelAuthority,
            changeRecipientAuthority,
            payoutInterval,
            startDate
          )
          .accounts({
            creator: creator.publicKey,
            recipient: recipient.publicKey,
            config,
            treasury: wallet.publicKey,
            vault,
            vaultAta,
            creatorTokenAccount: creatorTokenAccount.address,
            recipientTokenAccount: recipientTokenAccount.address,
            mint,
            tokenProgram: TOKEN_2022_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([creator])
          .rpc();

        await confirm(provider.connection, tx);
      } catch (e) {
        console.error(e);
        throw e;
      }
    });

    it("should not allow cancel", async () => {
      const { vault, vaultAta } = getPDAs(
        program.programId,
        identifier,
        creator.publicKey,
        recipient.publicKey,
        mint
      );

      try {
        const tx = await program.methods
          .cancel()
          .accounts({
            signer: creator.publicKey,
            creator: creator.publicKey,
            recipient: recipient.publicKey,
            vault,
            vaultAta,
            creatorTokenAccount: creatorTokenAccount.address,
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

    it("should not allow change recipient", async () => {
      const { vault } = getPDAs(
        program.programId,
        identifier,
        creator.publicKey,
        recipient.publicKey,
        mint
      );

      try {
        const tx = await program.methods
          .update()
          .accounts({
            signer: creator.publicKey,
            creator: creator.publicKey,
            recipient: recipient.publicKey,
            newRecipient: creator.publicKey,
            vault,
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

    it("should not disburse if vault is locked", async () => {
      const { vault, vaultAta } = getPDAs(
        program.programId,
        identifier,
        creator.publicKey,
        recipient.publicKey,
        mint
      );

      try {
        const tx = await program.methods
          .disburse()
          .accounts({
            signer: creator.publicKey,
            creator: creator.publicKey,
            recipient: recipient.publicKey,
            vault,
            vaultAta,
            recipientTokenAccount: recipientTokenAccount.address,
            mint,
            tokenProgram: TOKEN_2022_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([creator])
          .rpc();

        await confirm(provider.connection, tx);
      } catch (e) {
        if (e.error?.errorCode) {
          expect(e.error.errorCode.code).equals("Locked");
          expect(e.error.errorCode.number).equals(6000);
          expect(e.error.errorMessage).equals("The vault has not expired yet!");
        } else {
          console.log(e);
          assert.fail(e);
        }
      }
    });

    it("should disburse", async () => {
      const { vault, vaultAta } = getPDAs(
        program.programId,
        identifier,
        creator.publicKey,
        recipient.publicKey,
        mint
      );

      const vaultBefore = await getAccount(
        provider.connection,
        vaultAta,
        undefined,
        TOKEN_2022_PROGRAM_ID
      );

      try {
        await sleep(10000);
        const tx = await program.methods
          .disburse()
          .accounts({
            signer: creator.publicKey,
            creator: creator.publicKey,
            recipient: recipient.publicKey,
            vault,
            vaultAta,
            recipientTokenAccount: recipientTokenAccount.address,
            mint,
            tokenProgram: TOKEN_2022_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([creator])
          .rpc();

        await confirm(provider.connection, tx);

        const vaultAfter = await getAccount(
          provider.connection,
          vaultAta,
          undefined,
          TOKEN_2022_PROGRAM_ID
        );
        expect(vaultAfter.amount.toString()).equals("0");
      } catch (e) {
        console.error(e);
        throw e;
      }
    });
  });

  xdescribe("Vault - No schedule, has cancel, has update", () => {
    describe("recipient update authority", () => {
      it("should create a vault with recipient update authorites", async () => {
        identifier = new anchor.BN(randomBytes(8));
        const name = getName("Simple Vault");
        const amountToBeVested = new anchor.BN(1000);
        const totalVestingDuration = new anchor.BN(5);
        const cancelAuthority = getAuthority(Authority.Recipient, program);
        const changeRecipientAuthority = getAuthority(
          Authority.Recipient,
          program
        );
        const payoutInterval = new anchor.BN(0);
        const startDate = getNowInSeconds();
        const { config, vault, vaultAta, tokenAccountBump } = getPDAs(
          program.programId,
          identifier,
          creator.publicKey,
          recipient.publicKey,
          mint
        );

        try {
          const tx = await program.methods
            .create(
              identifier,
              name,
              amountToBeVested,
              totalVestingDuration,
              cancelAuthority,
              changeRecipientAuthority,
              payoutInterval,
              startDate
            )
            .accounts({
              creator: creator.publicKey,
              recipient: recipient.publicKey,
              config,
              treasury: wallet.publicKey,
              vault,
              vaultAta,
              creatorTokenAccount: creatorTokenAccount.address,
              recipientTokenAccount: recipientTokenAccount.address,
              mint,
              tokenProgram: TOKEN_2022_PROGRAM_ID,
              associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
              systemProgram: anchor.web3.SystemProgram.programId,
            })
            .signers([creator])
            .rpc();

          await confirm(provider.connection, tx);
        } catch (e) {
          console.error(e);
          throw e;
        }
      });

      it("should not allow cancel if not recipient", async () => {
        const { vault, vaultAta } = getPDAs(
          program.programId,
          identifier,
          creator.publicKey,
          recipient.publicKey,
          mint
        );

        try {
          const tx = await program.methods
            .cancel()
            .accounts({
              signer: creator.publicKey,
              creator: creator.publicKey,
              recipient: recipient.publicKey,
              vault,
              vaultAta,
              creatorTokenAccount: creatorTokenAccount.address,
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

      it("should allow cancel if recipient", async () => {
        const { vault, vaultAta } = getPDAs(
          program.programId,
          identifier,
          creator.publicKey,
          recipient.publicKey,
          mint
        );

        try {
          const tx = await program.methods
            .cancel()
            .accounts({
              signer: creator.publicKey,
              creator: creator.publicKey,
              recipient: recipient.publicKey,
              vault,
              vaultAta,
              creatorTokenAccount: creatorTokenAccount.address,
              mint,
              tokenProgram: TOKEN_2022_PROGRAM_ID,
              associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
              systemProgram: anchor.web3.SystemProgram.programId,
            })
            .signers([recipient])
            .rpc();

          await confirm(provider.connection, tx);
        } catch (e) {
          console.error(e);
          throw e;
        }
      });

      it("should not allow change recipient if not recipient", async () => {
        const { vault } = getPDAs(
          program.programId,
          identifier,
          creator.publicKey,
          recipient.publicKey,
          mint
        );

        try {
          const tx = await program.methods
            .update()
            .accounts({
              signer: creator.publicKey,
              creator: creator.publicKey,
              recipient: recipient.publicKey,
              newRecipient: creator.publicKey,
              vault,
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

      it("should allow change recipient if recipient", async () => {
        const { vault } = getPDAs(
          program.programId,
          identifier,
          creator.publicKey,
          recipient.publicKey,
          mint
        );

        try {
          const tx = await program.methods
            .update()
            .accounts({
              signer: creator.publicKey,
              creator: creator.publicKey,
              recipient: recipient.publicKey,
              newRecipient: creator.publicKey,
              vault,
              mint,
              tokenProgram: TOKEN_2022_PROGRAM_ID,
              associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
              systemProgram: anchor.web3.SystemProgram.programId,
            })
            .signers([recipient])
            .rpc();

          await confirm(provider.connection, tx);
        } catch (e) {
          console.error(e);
          throw e;
        }
      });

      it("should not disburse if vault is locked", async () => {});

      it("should disburse", async () => {});
    });

    describe("creator update authority", () => {
      it("should create a vault with creator update authorites", async () => {
        identifier = new anchor.BN(randomBytes(8));
        const name = getName("Simple Vault");
        const amountToBeVested = new anchor.BN(1000);
        const totalVestingDuration = new anchor.BN(5);
        const cancelAuthority = getAuthority(Authority.Recipient, program);
        const changeRecipientAuthority = getAuthority(
          Authority.Recipient,
          program
        );
        const payoutInterval = new anchor.BN(0);
        const startDate = getNowInSeconds();
        const { config, vault, vaultAta, tokenAccountBump } = getPDAs(
          program.programId,
          identifier,
          creator.publicKey,
          recipient.publicKey,
          mint
        );

        try {
          const tx = await program.methods
            .create(
              identifier,
              name,
              amountToBeVested,
              totalVestingDuration,
              cancelAuthority,
              changeRecipientAuthority,
              payoutInterval,
              startDate
            )
            .accounts({
              creator: creator.publicKey,
              recipient: recipient.publicKey,
              config,
              treasury: wallet.publicKey,
              vault,
              vaultAta,
              creatorTokenAccount: creatorTokenAccount.address,
              recipientTokenAccount: recipientTokenAccount.address,
              mint,
              tokenProgram: TOKEN_2022_PROGRAM_ID,
              associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
              systemProgram: anchor.web3.SystemProgram.programId,
            })
            .signers([creator])
            .rpc();

          await confirm(provider.connection, tx);
        } catch (e) {
          console.error(e);
          throw e;
        }
      });

      it("should not allow cancel if not creator", async () => {
        const { vault, vaultAta } = getPDAs(
          program.programId,
          identifier,
          creator.publicKey,
          recipient.publicKey,
          mint
        );

        try {
          const tx = await program.methods
            .cancel()
            .accounts({
              signer: recipient.publicKey,
              creator: creator.publicKey,
              recipient: recipient.publicKey,
              vault,
              vaultAta,
              creatorTokenAccount: creatorTokenAccount.address,
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

      it("should allow cancel if creator", async () => {
        const { vault, vaultAta } = getPDAs(
          program.programId,
          identifier,
          creator.publicKey,
          recipient.publicKey,
          mint
        );

        try {
          const tx = await program.methods
            .cancel()
            .accounts({
              signer: creator.publicKey,
              creator: creator.publicKey,
              recipient: recipient.publicKey,
              vault,
              vaultAta,
              creatorTokenAccount: creatorTokenAccount.address,
              mint,
              tokenProgram: TOKEN_2022_PROGRAM_ID,
              associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
              systemProgram: anchor.web3.SystemProgram.programId,
            })
            .signers([creator])
            .rpc();

          await confirm(provider.connection, tx);
        } catch (e) {
          console.error(e);
          throw e;
        }
      });

      it("should not allow change recipient if not creator", async () => {
        const { vault } = getPDAs(
          program.programId,
          identifier,
          creator.publicKey,
          recipient.publicKey,
          mint
        );

        try {
          const tx = await program.methods
            .update()
            .accounts({
              signer: recipient.publicKey,
              creator: creator.publicKey,
              recipient: recipient.publicKey,
              newRecipient: creator.publicKey,
              vault,
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

      it("should allow change recipient if creator", async () => {
        const { vault } = getPDAs(
          program.programId,
          identifier,
          creator.publicKey,
          recipient.publicKey,
          mint
        );

        try {
          const tx = await program.methods
            .update()
            .accounts({
              signer: creator.publicKey,
              creator: creator.publicKey,
              recipient: recipient.publicKey,
              newRecipient: creator.publicKey,
              vault,
              mint,
              tokenProgram: TOKEN_2022_PROGRAM_ID,
              associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
              systemProgram: anchor.web3.SystemProgram.programId,
            })
            .signers([creator])
            .rpc();

          await confirm(provider.connection, tx);
        } catch (e) {
          console.error(e);
          throw e;
        }
      });

      it("should not disburse if vault is locked", async () => {});

      it("should disburse", async () => {});
    });

    describe("both update authorities", () => {
      describe("recipient", () => {
        it("should create a vault with recipient update authorites", async () => {
          identifier = new anchor.BN(randomBytes(8));
          const name = getName("Simple Vault");
          const amountToBeVested = new anchor.BN(1000);
          const totalVestingDuration = new anchor.BN(5);
          const cancelAuthority = getAuthority(Authority.Recipient, program);
          const changeRecipientAuthority = getAuthority(
            Authority.Recipient,
            program
          );
          const payoutInterval = new anchor.BN(0);
          const startDate = getNowInSeconds();
          const { config, vault, vaultAta, tokenAccountBump } = getPDAs(
            program.programId,
            identifier,
            creator.publicKey,
            recipient.publicKey,
            mint
          );

          try {
            const tx = await program.methods
              .create(
                identifier,
                name,
                amountToBeVested,
                totalVestingDuration,
                cancelAuthority,
                changeRecipientAuthority,
                payoutInterval,
                startDate
              )
              .accounts({
                creator: creator.publicKey,
                recipient: recipient.publicKey,
                config,
                treasury: wallet.publicKey,
                vault,
                vaultAta,
                creatorTokenAccount: creatorTokenAccount.address,
                recipientTokenAccount: recipientTokenAccount.address,
                mint,
                tokenProgram: TOKEN_2022_PROGRAM_ID,
                associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
                systemProgram: anchor.web3.SystemProgram.programId,
              })
              .signers([creator])
              .rpc();

            await confirm(provider.connection, tx);
          } catch (e) {
            console.error(e);
            throw e;
          }
        });

        it("should not allow cancel if not recipient", async () => {
          const { vault, vaultAta } = getPDAs(
            program.programId,
            identifier,
            creator.publicKey,
            recipient.publicKey,
            mint
          );

          try {
            const tx = await program.methods
              .cancel()
              .accounts({
                signer: creator.publicKey,
                creator: creator.publicKey,
                recipient: recipient.publicKey,
                vault,
                vaultAta,
                creatorTokenAccount: creatorTokenAccount.address,
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

        it("should allow cancel if recipient", async () => {
          const { vault, vaultAta } = getPDAs(
            program.programId,
            identifier,
            creator.publicKey,
            recipient.publicKey,
            mint
          );

          try {
            const tx = await program.methods
              .cancel()
              .accounts({
                signer: creator.publicKey,
                creator: creator.publicKey,
                recipient: recipient.publicKey,
                vault,
                vaultAta,
                creatorTokenAccount: creatorTokenAccount.address,
                mint,
                tokenProgram: TOKEN_2022_PROGRAM_ID,
                associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
                systemProgram: anchor.web3.SystemProgram.programId,
              })
              .signers([recipient])
              .rpc();

            await confirm(provider.connection, tx);
          } catch (e) {
            console.error(e);
            throw e;
          }
        });

        it("should not allow change recipient if not recipient", async () => {
          const { vault } = getPDAs(
            program.programId,
            identifier,
            creator.publicKey,
            recipient.publicKey,
            mint
          );

          try {
            const tx = await program.methods
              .update()
              .accounts({
                signer: creator.publicKey,
                creator: creator.publicKey,
                recipient: recipient.publicKey,
                newRecipient: creator.publicKey,
                vault,
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

        it("should allow change recipient if recipient", async () => {
          const { vault } = getPDAs(
            program.programId,
            identifier,
            creator.publicKey,
            recipient.publicKey,
            mint
          );

          try {
            const tx = await program.methods
              .update()
              .accounts({
                signer: creator.publicKey,
                creator: creator.publicKey,
                recipient: recipient.publicKey,
                newRecipient: creator.publicKey,
                vault,
                mint,
                tokenProgram: TOKEN_2022_PROGRAM_ID,
                associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
                systemProgram: anchor.web3.SystemProgram.programId,
              })
              .signers([recipient])
              .rpc();

            await confirm(provider.connection, tx);
          } catch (e) {
            console.error(e);
            throw e;
          }
        });
      });

      describe("creator", () => {
        it("should create a vault with creator update authorites", async () => {
          identifier = new anchor.BN(randomBytes(8));
          const name = getName("Simple Vault");
          const amountToBeVested = new anchor.BN(1000);
          const totalVestingDuration = new anchor.BN(5);
          const cancelAuthority = getAuthority(Authority.Recipient, program);
          const changeRecipientAuthority = getAuthority(
            Authority.Recipient,
            program
          );
          const payoutInterval = new anchor.BN(0);
          const startDate = getNowInSeconds();
          const { config, vault, vaultAta, tokenAccountBump } = getPDAs(
            program.programId,
            identifier,
            creator.publicKey,
            recipient.publicKey,
            mint
          );

          try {
            const tx = await program.methods
              .create(
                identifier,
                name,
                amountToBeVested,
                totalVestingDuration,
                cancelAuthority,
                changeRecipientAuthority,
                payoutInterval,
                startDate
              )
              .accounts({
                creator: creator.publicKey,
                recipient: recipient.publicKey,
                config,
                treasury: wallet.publicKey,
                vault,
                vaultAta,
                creatorTokenAccount: creatorTokenAccount.address,
                recipientTokenAccount: recipientTokenAccount.address,
                mint,
                tokenProgram: TOKEN_2022_PROGRAM_ID,
                associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
                systemProgram: anchor.web3.SystemProgram.programId,
              })
              .signers([creator])
              .rpc();

            await confirm(provider.connection, tx);
          } catch (e) {
            console.error(e);
            throw e;
          }
        });

        it("should not allow cancel if not creator", async () => {
          const { vault, vaultAta } = getPDAs(
            program.programId,
            identifier,
            creator.publicKey,
            recipient.publicKey,
            mint
          );

          try {
            const tx = await program.methods
              .cancel()
              .accounts({
                signer: recipient.publicKey,
                creator: creator.publicKey,
                recipient: recipient.publicKey,
                vault,
                vaultAta,
                creatorTokenAccount: creatorTokenAccount.address,
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

        it("should allow cancel if creator", async () => {
          const { vault, vaultAta } = getPDAs(
            program.programId,
            identifier,
            creator.publicKey,
            recipient.publicKey,
            mint
          );

          try {
            const tx = await program.methods
              .cancel()
              .accounts({
                signer: creator.publicKey,
                creator: creator.publicKey,
                recipient: recipient.publicKey,
                vault,
                vaultAta,
                creatorTokenAccount: creatorTokenAccount.address,
                mint,
                tokenProgram: TOKEN_2022_PROGRAM_ID,
                associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
                systemProgram: anchor.web3.SystemProgram.programId,
              })
              .signers([creator])
              .rpc();

            await confirm(provider.connection, tx);
          } catch (e) {
            console.error(e);
            throw e;
          }
        });

        it("should not allow change recipient if not creator", async () => {
          const { vault } = getPDAs(
            program.programId,
            identifier,
            creator.publicKey,
            recipient.publicKey,
            mint
          );

          try {
            const tx = await program.methods
              .update()
              .accounts({
                signer: recipient.publicKey,
                creator: creator.publicKey,
                recipient: recipient.publicKey,
                newRecipient: creator.publicKey,
                vault,
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

        it("should allow change recipient if creator", async () => {
          const { vault } = getPDAs(
            program.programId,
            identifier,
            creator.publicKey,
            recipient.publicKey,
            mint
          );

          try {
            const tx = await program.methods
              .update()
              .accounts({
                signer: creator.publicKey,
                creator: creator.publicKey,
                recipient: recipient.publicKey,
                newRecipient: creator.publicKey,
                vault,
                mint,
                tokenProgram: TOKEN_2022_PROGRAM_ID,
                associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
                systemProgram: anchor.web3.SystemProgram.programId,
              })
              .signers([creator])
              .rpc();

            await confirm(provider.connection, tx);
          } catch (e) {
            console.error(e);
            throw e;
          }
        });
      });
    });
  });

  // describe("Vault - Schedule, has cancel, has update", () => {});
});
