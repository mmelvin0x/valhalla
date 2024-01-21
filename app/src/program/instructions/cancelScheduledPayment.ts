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
 * @category CancelScheduledPayment
 * @category generated
 */
export const cancelScheduledPaymentStruct = new beet.BeetArgsStruct<{
  instructionDiscriminator: number[] /* size: 8 */;
}>(
  [["instructionDiscriminator", beet.uniformFixedSizeArray(beet.u8, 8)]],
  "CancelScheduledPaymentInstructionArgs",
);
/**
 * Accounts required by the _cancelScheduledPayment_ instruction
 *
 * @property [_writable_, **signer**] signer
 * @property [_writable_] creator
 * @property [_writable_] recipient
 * @property [_writable_] scheduledPayment
 * @property [_writable_] paymentTokenAccount
 * @property [_writable_] creatorTokenAccount
 * @property [] mint
 * @property [] associatedTokenProgram
 * @category Instructions
 * @category CancelScheduledPayment
 * @category generated
 */
export type CancelScheduledPaymentInstructionAccounts = {
  signer: web3.PublicKey;
  creator: web3.PublicKey;
  recipient: web3.PublicKey;
  scheduledPayment: web3.PublicKey;
  paymentTokenAccount: web3.PublicKey;
  creatorTokenAccount: web3.PublicKey;
  mint: web3.PublicKey;
  tokenProgram?: web3.PublicKey;
  associatedTokenProgram: web3.PublicKey;
  systemProgram?: web3.PublicKey;
};

export const cancelScheduledPaymentInstructionDiscriminator = [
  12, 121, 42, 81, 9, 5, 183, 127,
];

/**
 * Creates a _CancelScheduledPayment_ instruction.
 *
 * @param accounts that will be accessed while the instruction is processed
 * @category Instructions
 * @category CancelScheduledPayment
 * @category generated
 */
export function createCancelScheduledPaymentInstruction(
  accounts: CancelScheduledPaymentInstructionAccounts,
  programId = new web3.PublicKey(
    "CpeQRExCTr7a6pzjF7mGsT6HZVpAM636xSUFC4STTJFn",
  ),
) {
  const [data] = cancelScheduledPaymentStruct.serialize({
    instructionDiscriminator: cancelScheduledPaymentInstructionDiscriminator,
  });
  const keys: web3.AccountMeta[] = [
    {
      pubkey: accounts.signer,
      isWritable: true,
      isSigner: true,
    },
    {
      pubkey: accounts.creator,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: accounts.recipient,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: accounts.scheduledPayment,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: accounts.paymentTokenAccount,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: accounts.creatorTokenAccount,
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
