/**
 * This code was GENERATED using the solita package.
 * Please DO NOT EDIT THIS FILE, instead rerun solita to update it or write a wrapper to add functionality.
 *
 * See: https://github.com/metaplex-foundation/solita
 */

import * as web3 from '@solana/web3.js'
import * as beet from '@metaplex-foundation/beet'
import * as beetSolana from '@metaplex-foundation/beet-solana'
import { Authority, authorityBeet } from '../types/Authority'

/**
 * Arguments used to create {@link Lock}
 * @category Accounts
 * @category generated
 */
export type LockArgs = {
  funder: web3.PublicKey
  recipient: web3.PublicKey
  mint: web3.PublicKey
  cancelAuthority: Authority
  changeRecipientAuthority: Authority
  vestingDuration: beet.bignum
  payoutInterval: beet.bignum
  amountPerPayout: beet.bignum
  startDate: beet.bignum
  cliffPaymentAmount: beet.bignum
  lastPaymentTimestamp: beet.bignum
  numberOfPaymentsMade: beet.bignum
  isCliffPaymentDisbursed: boolean
  name: string
}

export const lockDiscriminator = [8, 255, 36, 202, 210, 22, 57, 137]
/**
 * Holds the data for the {@link Lock} Account and provides de/serialization
 * functionality for that data
 *
 * @category Accounts
 * @category generated
 */
export class Lock implements LockArgs {
  private constructor(
    readonly funder: web3.PublicKey,
    readonly recipient: web3.PublicKey,
    readonly mint: web3.PublicKey,
    readonly cancelAuthority: Authority,
    readonly changeRecipientAuthority: Authority,
    readonly vestingDuration: beet.bignum,
    readonly payoutInterval: beet.bignum,
    readonly amountPerPayout: beet.bignum,
    readonly startDate: beet.bignum,
    readonly cliffPaymentAmount: beet.bignum,
    readonly lastPaymentTimestamp: beet.bignum,
    readonly numberOfPaymentsMade: beet.bignum,
    readonly isCliffPaymentDisbursed: boolean,
    readonly name: string
  ) {}

  /**
   * Creates a {@link Lock} instance from the provided args.
   */
  static fromArgs(args: LockArgs) {
    return new Lock(
      args.funder,
      args.recipient,
      args.mint,
      args.cancelAuthority,
      args.changeRecipientAuthority,
      args.vestingDuration,
      args.payoutInterval,
      args.amountPerPayout,
      args.startDate,
      args.cliffPaymentAmount,
      args.lastPaymentTimestamp,
      args.numberOfPaymentsMade,
      args.isCliffPaymentDisbursed,
      args.name
    )
  }

  /**
   * Deserializes the {@link Lock} from the data of the provided {@link web3.AccountInfo}.
   * @returns a tuple of the account data and the offset up to which the buffer was read to obtain it.
   */
  static fromAccountInfo(
    accountInfo: web3.AccountInfo<Buffer>,
    offset = 0
  ): [Lock, number] {
    return Lock.deserialize(accountInfo.data, offset)
  }

  /**
   * Retrieves the account info from the provided address and deserializes
   * the {@link Lock} from its data.
   *
   * @throws Error if no account info is found at the address or if deserialization fails
   */
  static async fromAccountAddress(
    connection: web3.Connection,
    address: web3.PublicKey,
    commitmentOrConfig?: web3.Commitment | web3.GetAccountInfoConfig
  ): Promise<Lock> {
    const accountInfo = await connection.getAccountInfo(
      address,
      commitmentOrConfig
    )
    if (accountInfo == null) {
      throw new Error(`Unable to find Lock account at ${address}`)
    }
    return Lock.fromAccountInfo(accountInfo, 0)[0]
  }

  /**
   * Provides a {@link web3.Connection.getProgramAccounts} config builder,
   * to fetch accounts matching filters that can be specified via that builder.
   *
   * @param programId - the program that owns the accounts we are filtering
   */
  static gpaBuilder(
    programId: web3.PublicKey = new web3.PublicKey(
      'C572QduUUQuKezefbfFutKMgKA5uANzCu4LXXVHQbMEg'
    )
  ) {
    return beetSolana.GpaBuilder.fromStruct(programId, lockBeet)
  }

  /**
   * Deserializes the {@link Lock} from the provided data Buffer.
   * @returns a tuple of the account data and the offset up to which the buffer was read to obtain it.
   */
  static deserialize(buf: Buffer, offset = 0): [Lock, number] {
    return lockBeet.deserialize(buf, offset)
  }

  /**
   * Serializes the {@link Lock} into a Buffer.
   * @returns a tuple of the created Buffer and the offset up to which the buffer was written to store it.
   */
  serialize(): [Buffer, number] {
    return lockBeet.serialize({
      accountDiscriminator: lockDiscriminator,
      ...this,
    })
  }

  /**
   * Returns the byteSize of a {@link Buffer} holding the serialized data of
   * {@link Lock} for the provided args.
   *
   * @param args need to be provided since the byte size for this account
   * depends on them
   */
  static byteSize(args: LockArgs) {
    const instance = Lock.fromArgs(args)
    return lockBeet.toFixedFromValue({
      accountDiscriminator: lockDiscriminator,
      ...instance,
    }).byteSize
  }

  /**
   * Fetches the minimum balance needed to exempt an account holding
   * {@link Lock} data from rent
   *
   * @param args need to be provided since the byte size for this account
   * depends on them
   * @param connection used to retrieve the rent exemption information
   */
  static async getMinimumBalanceForRentExemption(
    args: LockArgs,
    connection: web3.Connection,
    commitment?: web3.Commitment
  ): Promise<number> {
    return connection.getMinimumBalanceForRentExemption(
      Lock.byteSize(args),
      commitment
    )
  }

  /**
   * Returns a readable version of {@link Lock} properties
   * and can be used to convert to JSON and/or logging
   */
  pretty() {
    return {
      funder: this.funder.toBase58(),
      recipient: this.recipient.toBase58(),
      mint: this.mint.toBase58(),
      cancelAuthority: 'Authority.' + Authority[this.cancelAuthority],
      changeRecipientAuthority:
        'Authority.' + Authority[this.changeRecipientAuthority],
      vestingDuration: (() => {
        const x = <{ toNumber: () => number }>this.vestingDuration
        if (typeof x.toNumber === 'function') {
          try {
            return x.toNumber()
          } catch (_) {
            return x
          }
        }
        return x
      })(),
      payoutInterval: (() => {
        const x = <{ toNumber: () => number }>this.payoutInterval
        if (typeof x.toNumber === 'function') {
          try {
            return x.toNumber()
          } catch (_) {
            return x
          }
        }
        return x
      })(),
      amountPerPayout: (() => {
        const x = <{ toNumber: () => number }>this.amountPerPayout
        if (typeof x.toNumber === 'function') {
          try {
            return x.toNumber()
          } catch (_) {
            return x
          }
        }
        return x
      })(),
      startDate: (() => {
        const x = <{ toNumber: () => number }>this.startDate
        if (typeof x.toNumber === 'function') {
          try {
            return x.toNumber()
          } catch (_) {
            return x
          }
        }
        return x
      })(),
      cliffPaymentAmount: (() => {
        const x = <{ toNumber: () => number }>this.cliffPaymentAmount
        if (typeof x.toNumber === 'function') {
          try {
            return x.toNumber()
          } catch (_) {
            return x
          }
        }
        return x
      })(),
      lastPaymentTimestamp: (() => {
        const x = <{ toNumber: () => number }>this.lastPaymentTimestamp
        if (typeof x.toNumber === 'function') {
          try {
            return x.toNumber()
          } catch (_) {
            return x
          }
        }
        return x
      })(),
      numberOfPaymentsMade: (() => {
        const x = <{ toNumber: () => number }>this.numberOfPaymentsMade
        if (typeof x.toNumber === 'function') {
          try {
            return x.toNumber()
          } catch (_) {
            return x
          }
        }
        return x
      })(),
      isCliffPaymentDisbursed: this.isCliffPaymentDisbursed,
      name: this.name,
    }
  }
}

/**
 * @category Accounts
 * @category generated
 */
export const lockBeet = new beet.FixableBeetStruct<
  Lock,
  LockArgs & {
    accountDiscriminator: number[] /* size: 8 */
  }
>(
  [
    ['accountDiscriminator', beet.uniformFixedSizeArray(beet.u8, 8)],
    ['funder', beetSolana.publicKey],
    ['recipient', beetSolana.publicKey],
    ['mint', beetSolana.publicKey],
    ['cancelAuthority', authorityBeet],
    ['changeRecipientAuthority', authorityBeet],
    ['vestingDuration', beet.u64],
    ['payoutInterval', beet.u64],
    ['amountPerPayout', beet.u64],
    ['startDate', beet.u64],
    ['cliffPaymentAmount', beet.u64],
    ['lastPaymentTimestamp', beet.u64],
    ['numberOfPaymentsMade', beet.u64],
    ['isCliffPaymentDisbursed', beet.bool],
    ['name', beet.utf8String],
  ],
  Lock.fromArgs,
  'Lock'
)
