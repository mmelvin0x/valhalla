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
 * @category DisburseScheduledPayment
 * @category generated
 */
export const disburseScheduledPaymentStruct = new beet.BeetArgsStruct<{
  instructionDiscriminator: number[] /* size: 8 */;
}>(
  [["instructionDiscriminator", beet.uniformFixedSizeArray(beet.u8, 8)]],
  "DisburseScheduledPaymentInstructionArgs",
);
/**
 * Accounts required by the _disburseScheduledPayment_ instruction
 *
 * @property [_writable_, **signer**] signer
 * @property [] creator
 * @property [] recipient
 * @property [_writable_] recipientTokenAccount
 * @property [_writable_] scheduledPayment
 * @property [_writable_] paymentTokenAccount
 * @property [] mint
 * @property [] associatedTokenProgram
 * @category Instructions
 * @category DisburseScheduledPayment
 * @category generated
 */
export type DisburseScheduledPaymentInstructionAccounts = {
  signer: web3.PublicKey;
  creator: web3.PublicKey;
  recipient: web3.PublicKey;
  recipientTokenAccount: web3.PublicKey;
  scheduledPayment: web3.PublicKey;
  paymentTokenAccount: web3.PublicKey;
  mint: web3.PublicKey;
  tokenProgram?: web3.PublicKey;
  associatedTokenProgram: web3.PublicKey;
  systemProgram?: web3.PublicKey;
};

export const disburseScheduledPaymentInstructionDiscriminator = [
  103, 97, 120, 57, 34, 113, 22, 27,
];

/**
 * Creates a _DisburseScheduledPayment_ instruction.
 *
 * @param accounts that will be accessed while the instruction is processed
 * @category Instructions
 * @category DisburseScheduledPayment
 * @category generated
 */
export function createDisburseScheduledPaymentInstruction(
  accounts: DisburseScheduledPaymentInstructionAccounts,
  programId = new web3.PublicKey(
    "CpeQRExCTr7a6pzjF7mGsT6HZVpAM636xSUFC4STTJFn",
  ),
) {
  const [data] = disburseScheduledPaymentStruct.serialize({
    instructionDiscriminator: disburseScheduledPaymentInstructionDiscriminator,
  });
  const keys: web3.AccountMeta[] = [
    {
      pubkey: accounts.signer,
      isWritable: true,
      isSigner: true,
    },
    {
      pubkey: accounts.creator,
      isWritable: false,
      isSigner: false,
    },
    {
      pubkey: accounts.recipient,
      isWritable: false,
      isSigner: false,
    },
    {
      pubkey: accounts.recipientTokenAccount,
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