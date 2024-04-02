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
 * @category Cancel
 * @category generated
 */
export const cancelStruct = new beet.BeetArgsStruct<{
  instructionDiscriminator: number[] /* size: 8 */
}>(
  [['instructionDiscriminator', beet.uniformFixedSizeArray(beet.u8, 8)]],
  'CancelInstructionArgs'
)
/**
 * Accounts required by the _cancel_ instruction
 *
 * @property [_writable_, **signer**] signer
 * @property [_writable_] creator
 * @property [_writable_] recipient
 * @property [_writable_] vault
 * @property [_writable_] vaultAta
 * @property [_writable_] creatorAta
 * @property [] mint
 * @property [] associatedTokenProgram
 * @category Instructions
 * @category Cancel
 * @category generated
 */
export type CancelInstructionAccounts = {
  signer: web3.PublicKey
  creator: web3.PublicKey
  recipient: web3.PublicKey
  vault: web3.PublicKey
  vaultAta: web3.PublicKey
  creatorAta: web3.PublicKey
  mint: web3.PublicKey
  tokenProgram?: web3.PublicKey
  associatedTokenProgram: web3.PublicKey
  systemProgram?: web3.PublicKey
}

export const cancelInstructionDiscriminator = [
  232, 219, 223, 41, 219, 236, 220, 190,
]

/**
 * Creates a _Cancel_ instruction.
 *
 * @param accounts that will be accessed while the instruction is processed
 * @category Instructions
 * @category Cancel
 * @category generated
 */
export function createCancelInstruction(
  accounts: CancelInstructionAccounts,
  programId = new web3.PublicKey('FuPeiYYSevDpgLjfVckWewukMrLWrkwYPaZfU1uwgnyX')
) {
  const [data] = cancelStruct.serialize({
    instructionDiscriminator: cancelInstructionDiscriminator,
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
      pubkey: accounts.vault,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: accounts.vaultAta,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: accounts.creatorAta,
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
