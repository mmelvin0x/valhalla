/**
 * This code was GENERATED using the solita package.
 * Please DO NOT EDIT THIS FILE, instead rerun solita to update it or write a wrapper to add functionality.
 *
 * See: https://github.com/metaplex-foundation/solita
 */

import * as splToken from '@solana/spl-token'
import * as beet from '@metaplex-foundation/beet'
import * as web3 from '@solana/web3.js'

/**
 * @category Instructions
 * @category UpdateVestingSchedule
 * @category generated
 */
export const updateVestingScheduleStruct = new beet.BeetArgsStruct<{
  instructionDiscriminator: number[] /* size: 8 */
}>(
  [['instructionDiscriminator', beet.uniformFixedSizeArray(beet.u8, 8)]],
  'UpdateVestingScheduleInstructionArgs'
)
/**
 * Accounts required by the _updateVestingSchedule_ instruction
 *
 * @property [_writable_, **signer**] signer
 * @property [_writable_] creator
 * @property [_writable_] recipient
 * @property [] newRecipient
 * @property [_writable_] vestingSchedule
 * @property [] mint
 * @property [] associatedTokenProgram
 * @category Instructions
 * @category UpdateVestingSchedule
 * @category generated
 */
export type UpdateVestingScheduleInstructionAccounts = {
  signer: web3.PublicKey
  creator: web3.PublicKey
  recipient: web3.PublicKey
  newRecipient: web3.PublicKey
  vestingSchedule: web3.PublicKey
  mint: web3.PublicKey
  tokenProgram?: web3.PublicKey
  associatedTokenProgram: web3.PublicKey
  systemProgram?: web3.PublicKey
}

export const updateVestingScheduleInstructionDiscriminator = [
  249, 18, 68, 193, 205, 46, 146, 114,
]

/**
 * Creates a _UpdateVestingSchedule_ instruction.
 *
 * @param accounts that will be accessed while the instruction is processed
 * @category Instructions
 * @category UpdateVestingSchedule
 * @category generated
 */
export function createUpdateVestingScheduleInstruction(
  accounts: UpdateVestingScheduleInstructionAccounts,
  programId = new web3.PublicKey('AX3N5z4zvC1E3bYwjh16QniLDuyRVEM3ZFKxfWsrSJ7p')
) {
  const [data] = updateVestingScheduleStruct.serialize({
    instructionDiscriminator: updateVestingScheduleInstructionDiscriminator,
  })
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
      pubkey: accounts.newRecipient,
      isWritable: false,
      isSigner: false,
    },
    {
      pubkey: accounts.vestingSchedule,
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
