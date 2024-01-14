/**
 * This code was GENERATED using the solita package.
 * Please DO NOT EDIT THIS FILE, instead rerun solita to update it or write a wrapper to add functionality.
 *
 * See: https://github.com/metaplex-foundation/solita
 */

import * as splToken from "@solana/spl-token";
import * as beet from "@metaplex-foundation/beet";
import * as web3 from "@solana/web3.js";

/**
 * @category Instructions
 * @category Disburse
 * @category generated
 */
export const disburseStruct = new beet.BeetArgsStruct<{
  instructionDiscriminator: number[] /* size: 8 */;
}>(
  [["instructionDiscriminator", beet.uniformFixedSizeArray(beet.u8, 8)]],
  "DisburseInstructionArgs"
);
/**
 * Accounts required by the _disburse_ instruction
 *
 * @property [_writable_, **signer**] signer
 * @property [] funder
 * @property [] recipient
 * @property [_writable_] lock
 * @property [_writable_] lockTokenAccount
 * @property [_writable_] recipientTokenAccount
 * @property [] mint
 * @property [] associatedTokenProgram
 * @category Instructions
 * @category Disburse
 * @category generated
 */
export type DisburseInstructionAccounts = {
  signer: web3.PublicKey;
  funder: web3.PublicKey;
  recipient: web3.PublicKey;
  lock: web3.PublicKey;
  lockTokenAccount: web3.PublicKey;
  recipientTokenAccount: web3.PublicKey;
  mint: web3.PublicKey;
  tokenProgram?: web3.PublicKey;
  associatedTokenProgram: web3.PublicKey;
  systemProgram?: web3.PublicKey;
};

export const disburseInstructionDiscriminator = [
  68, 250, 205, 89, 217, 142, 13, 44,
];

/**
 * Creates a _Disburse_ instruction.
 *
 * @param accounts that will be accessed while the instruction is processed
 * @category Instructions
 * @category Disburse
 * @category generated
 */
export function createDisburseInstruction(
  accounts: DisburseInstructionAccounts,
  programId = new web3.PublicKey("BgfvN8xjwoBD8YDvpDAFPZW6QxJeqrEZWvoXGg21PVzU")
) {
  const [data] = disburseStruct.serialize({
    instructionDiscriminator: disburseInstructionDiscriminator,
  });
  const keys: web3.AccountMeta[] = [
    {
      pubkey: accounts.signer,
      isWritable: true,
      isSigner: true,
    },
    {
      pubkey: accounts.funder,
      isWritable: false,
      isSigner: false,
    },
    {
      pubkey: accounts.recipient,
      isWritable: false,
      isSigner: false,
    },
    {
      pubkey: accounts.lock,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: accounts.lockTokenAccount,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: accounts.recipientTokenAccount,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: accounts.mint,
      isWritable: false,
      isSigner: false,
    },
    {
      pubkey: accounts.tokenProgram ?? splToken.TOKEN_PROGRAM_ID,
      isWritable: false,
      isSigner: false,
    },
    {
      pubkey: accounts.associatedTokenProgram,
      isWritable: false,
      isSigner: false,
    },
    {
      pubkey: accounts.systemProgram ?? web3.SystemProgram.programId,
      isWritable: false,
      isSigner: false,
    },
  ];

  const ix = new web3.TransactionInstruction({
    programId,
    keys,
    data,
  });
  return ix;
}
