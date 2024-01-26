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
 * @category CreateTokenLock
 * @category generated
 */
export type CreateTokenLockInstructionArgs = {
  amountToBeVested: beet.bignum
  totalVestingDuration: beet.bignum
  name: number[] /* size: 32 */
}
/**
 * @category Instructions
 * @category CreateTokenLock
 * @category generated
 */
export const createTokenLockStruct = new beet.BeetArgsStruct<
  CreateTokenLockInstructionArgs & {
    instructionDiscriminator: number[] /* size: 8 */
  }
>(
  [
    ['instructionDiscriminator', beet.uniformFixedSizeArray(beet.u8, 8)],
    ['amountToBeVested', beet.u64],
    ['totalVestingDuration', beet.u64],
    ['name', beet.uniformFixedSizeArray(beet.u8, 32)],
  ],
  'CreateTokenLockInstructionArgs'
)
/**
 * Accounts required by the _createTokenLock_ instruction
 *
 * @property [_writable_, **signer**] creator
 * @property [] config
 * @property [_writable_] treasury
 * @property [_writable_] tokenLock
 * @property [_writable_] tokenLockTokenAccount
 * @property [_writable_] creatorTokenAccount
 * @property [] mint
 * @property [] associatedTokenProgram
 * @category Instructions
 * @category CreateTokenLock
 * @category generated
 */
export type CreateTokenLockInstructionAccounts = {
  creator: web3.PublicKey
  config: web3.PublicKey
  treasury: web3.PublicKey
  tokenLock: web3.PublicKey
  tokenLockTokenAccount: web3.PublicKey
  creatorTokenAccount: web3.PublicKey
  mint: web3.PublicKey
  tokenProgram?: web3.PublicKey
  associatedTokenProgram: web3.PublicKey
  systemProgram?: web3.PublicKey
}

export const createTokenLockInstructionDiscriminator = [
  241, 77, 106, 72, 250, 94, 44, 51,
]

/**
 * Creates a _CreateTokenLock_ instruction.
 *
 * @param accounts that will be accessed while the instruction is processed
 * @param args to provide as instruction data to the program
 *
 * @category Instructions
 * @category CreateTokenLock
 * @category generated
 */
export function createCreateTokenLockInstruction(
  accounts: CreateTokenLockInstructionAccounts,
  args: CreateTokenLockInstructionArgs,
  programId = new web3.PublicKey('kY1w5a15ADvW28ZKnoSmbK53LnrBdwiUX5gg4fHq6nc')
) {
  const [data] = createTokenLockStruct.serialize({
    instructionDiscriminator: createTokenLockInstructionDiscriminator,
    ...args,
  })
  const keys: web3.AccountMeta[] = [
    {
      pubkey: accounts.creator,
      isWritable: true,
      isSigner: true,
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
      pubkey: accounts.tokenLock,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: accounts.tokenLockTokenAccount,
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
  ]

  const ix = new web3.TransactionInstruction({
    programId,
    keys,
    data,
  })
  return ix
}
