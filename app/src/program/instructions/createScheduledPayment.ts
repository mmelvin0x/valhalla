/**
 * This code was GENERATED using the solita package.
 * Please DO NOT EDIT THIS FILE, instead rerun solita to update it or write a wrapper to add functionality.
 *
 * See: https://github.com/metaplex-foundation/solita
 */

import * as splToken from '@solana/spl-token'
import * as beet from '@metaplex-foundation/beet'
import * as web3 from '@solana/web3.js'
import { Authority, authorityBeet } from '../types/Authority'

/**
 * @category Instructions
 * @category CreateScheduledPayment
 * @category generated
 */
export type CreateScheduledPaymentInstructionArgs = {
  amountToBeVested: beet.bignum
  totalVestingDuration: beet.bignum
  cancelAuthority: Authority
  changeRecipientAuthority: Authority
  name: number[] /* size: 32 */
}
/**
 * @category Instructions
 * @category CreateScheduledPayment
 * @category generated
 */
export const createScheduledPaymentStruct = new beet.BeetArgsStruct<
  CreateScheduledPaymentInstructionArgs & {
    instructionDiscriminator: number[] /* size: 8 */
  }
>(
  [
    ['instructionDiscriminator', beet.uniformFixedSizeArray(beet.u8, 8)],
    ['amountToBeVested', beet.u64],
    ['totalVestingDuration', beet.u64],
    ['cancelAuthority', authorityBeet],
    ['changeRecipientAuthority', authorityBeet],
    ['name', beet.uniformFixedSizeArray(beet.u8, 32)],
  ],
  'CreateScheduledPaymentInstructionArgs'
)
/**
 * Accounts required by the _createScheduledPayment_ instruction
 *
 * @property [_writable_, **signer**] creator
 * @property [] recipient
 * @property [] config
 * @property [_writable_] treasury
 * @property [_writable_] scheduledPayment
 * @property [_writable_] scheduledPaymentTokenAccount
 * @property [_writable_] creatorTokenAccount
 * @property [_writable_] recipientTokenAccount
 * @property [] mint
 * @property [] associatedTokenProgram
 * @category Instructions
 * @category CreateScheduledPayment
 * @category generated
 */
export type CreateScheduledPaymentInstructionAccounts = {
  creator: web3.PublicKey
  recipient: web3.PublicKey
  config: web3.PublicKey
  treasury: web3.PublicKey
  scheduledPayment: web3.PublicKey
  scheduledPaymentTokenAccount: web3.PublicKey
  creatorTokenAccount: web3.PublicKey
  recipientTokenAccount: web3.PublicKey
  mint: web3.PublicKey
  tokenProgram?: web3.PublicKey
  associatedTokenProgram: web3.PublicKey
  systemProgram?: web3.PublicKey
}

export const createScheduledPaymentInstructionDiscriminator = [
  197, 210, 201, 242, 49, 20, 122, 4,
]

/**
 * Creates a _CreateScheduledPayment_ instruction.
 *
 * @param accounts that will be accessed while the instruction is processed
 * @param args to provide as instruction data to the program
 *
 * @category Instructions
 * @category CreateScheduledPayment
 * @category generated
 */
export function createCreateScheduledPaymentInstruction(
  accounts: CreateScheduledPaymentInstructionAccounts,
  args: CreateScheduledPaymentInstructionArgs,
  programId = new web3.PublicKey('AX3N5z4zvC1E3bYwjh16QniLDuyRVEM3ZFKxfWsrSJ7p')
) {
  const [data] = createScheduledPaymentStruct.serialize({
    instructionDiscriminator: createScheduledPaymentInstructionDiscriminator,
    ...args,
  })
  const keys: web3.AccountMeta[] = [
    {
      pubkey: accounts.creator,
      isWritable: true,
      isSigner: true,
    },
    {
      pubkey: accounts.recipient,
      isWritable: false,
      isSigner: false,
    },
    {
      pubkey: accounts.config,
      isWritable: false,
      isSigner: false,
    },
    {
      pubkey: accounts.treasury,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: accounts.scheduledPayment,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: accounts.scheduledPaymentTokenAccount,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: accounts.creatorTokenAccount,
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
  ]

  const ix = new web3.TransactionInstruction({
    programId,
    keys,
    data,
  })
  return ix
}
