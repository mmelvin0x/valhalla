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
import { VestingType, vestingTypeBeet } from '../types/VestingType'

/**
 * Arguments used to create {@link ScheduledPayment}
 * @category Accounts
 * @category generated
 */
export type ScheduledPaymentArgs = {
  creator: web3.PublicKey
  recipient: web3.PublicKey
  mint: web3.PublicKey
  name: number[] /* size: 32 */
  totalVestingDuration: beet.bignum
  createdTimestamp: beet.bignum
  cancelAuthority: Authority
  changeRecipientAuthority: Authority
  vestingType: VestingType
}

export const scheduledPaymentDiscriminator = [
  109, 136, 133, 45, 172, 50, 96, 152,
]
/**
 * Holds the data for the {@link ScheduledPayment} Account and provides de/serialization
 * functionality for that data
 *
 * @category Accounts
 * @category generated
 */
export class ScheduledPayment implements ScheduledPaymentArgs {
  private constructor(
    readonly creator: web3.PublicKey,
    readonly recipient: web3.PublicKey,
    readonly mint: web3.PublicKey,
    readonly name: number[] /* size: 32 */,
    readonly totalVestingDuration: beet.bignum,
    readonly createdTimestamp: beet.bignum,
    readonly cancelAuthority: Authority,
    readonly changeRecipientAuthority: Authority,
    readonly vestingType: VestingType
  ) {}

  /**
   * Creates a {@link ScheduledPayment} instance from the provided args.
   */
  static fromArgs(args: ScheduledPaymentArgs) {
    return new ScheduledPayment(
      args.creator,
      args.recipient,
      args.mint,
      args.name,
      args.totalVestingDuration,
      args.createdTimestamp,
      args.cancelAuthority,
      args.changeRecipientAuthority,
      args.vestingType
    )
  }

  /**
   * Deserializes the {@link ScheduledPayment} from the data of the provided {@link web3.AccountInfo}.
   * @returns a tuple of the account data and the offset up to which the buffer was read to obtain it.
   */
  static fromAccountInfo(
    accountInfo: web3.AccountInfo<Buffer>,
    offset = 0
  ): [ScheduledPayment, number] {
    return ScheduledPayment.deserialize(accountInfo.data, offset)
  }

  /**
   * Retrieves the account info from the provided address and deserializes
   * the {@link ScheduledPayment} from its data.
   *
   * @throws Error if no account info is found at the address or if deserialization fails
   */
  static async fromAccountAddress(
    connection: web3.Connection,
    address: web3.PublicKey,
    commitmentOrConfig?: web3.Commitment | web3.GetAccountInfoConfig
  ): Promise<ScheduledPayment> {
    const accountInfo = await connection.getAccountInfo(
      address,
      commitmentOrConfig
    )
    if (accountInfo == null) {
      throw new Error(`Unable to find ScheduledPayment account at ${address}`)
    }
    return ScheduledPayment.fromAccountInfo(accountInfo, 0)[0]
  }

  /**
   * Provides a {@link web3.Connection.getProgramAccounts} config builder,
   * to fetch accounts matching filters that can be specified via that builder.
   *
   * @param programId - the program that owns the accounts we are filtering
   */
  static gpaBuilder(
    programId: web3.PublicKey = new web3.PublicKey(
      'AX3N5z4zvC1E3bYwjh16QniLDuyRVEM3ZFKxfWsrSJ7p'
    )
  ) {
    return beetSolana.GpaBuilder.fromStruct(programId, scheduledPaymentBeet)
  }

  /**
   * Deserializes the {@link ScheduledPayment} from the provided data Buffer.
   * @returns a tuple of the account data and the offset up to which the buffer was read to obtain it.
   */
  static deserialize(buf: Buffer, offset = 0): [ScheduledPayment, number] {
    return scheduledPaymentBeet.deserialize(buf, offset)
  }

  /**
   * Serializes the {@link ScheduledPayment} into a Buffer.
   * @returns a tuple of the created Buffer and the offset up to which the buffer was written to store it.
   */
  serialize(): [Buffer, number] {
    return scheduledPaymentBeet.serialize({
      accountDiscriminator: scheduledPaymentDiscriminator,
      ...this,
    })
  }

  /**
   * Returns the byteSize of a {@link Buffer} holding the serialized data of
   * {@link ScheduledPayment}
   */
  static get byteSize() {
    return scheduledPaymentBeet.byteSize
  }

  /**
   * Fetches the minimum balance needed to exempt an account holding
   * {@link ScheduledPayment} data from rent
   *
   * @param connection used to retrieve the rent exemption information
   */
  static async getMinimumBalanceForRentExemption(
    connection: web3.Connection,
    commitment?: web3.Commitment
  ): Promise<number> {
    return connection.getMinimumBalanceForRentExemption(
      ScheduledPayment.byteSize,
      commitment
    )
  }

  /**
   * Determines if the provided {@link Buffer} has the correct byte size to
   * hold {@link ScheduledPayment} data.
   */
  static hasCorrectByteSize(buf: Buffer, offset = 0) {
    return buf.byteLength - offset === ScheduledPayment.byteSize
  }

  /**
   * Returns a readable version of {@link ScheduledPayment} properties
   * and can be used to convert to JSON and/or logging
   */
  pretty() {
    return {
      creator: this.creator.toBase58(),
      recipient: this.recipient.toBase58(),
      mint: this.mint.toBase58(),
      name: this.name,
      totalVestingDuration: (() => {
        const x = <{ toNumber: () => number }>this.totalVestingDuration
        if (typeof x.toNumber === 'function') {
          try {
            return x.toNumber()
          } catch (_) {
            return x
          }
        }
        return x
      })(),
      createdTimestamp: (() => {
        const x = <{ toNumber: () => number }>this.createdTimestamp
        if (typeof x.toNumber === 'function') {
          try {
            return x.toNumber()
          } catch (_) {
            return x
          }
        }
        return x
      })(),
      cancelAuthority: 'Authority.' + Authority[this.cancelAuthority],
      changeRecipientAuthority:
        'Authority.' + Authority[this.changeRecipientAuthority],
      vestingType: 'VestingType.' + VestingType[this.vestingType],
    }
  }
}

/**
 * @category Accounts
 * @category generated
 */
export const scheduledPaymentBeet = new beet.BeetStruct<
  ScheduledPayment,
  ScheduledPaymentArgs & {
    accountDiscriminator: number[] /* size: 8 */
  }
>(
  [
    ['accountDiscriminator', beet.uniformFixedSizeArray(beet.u8, 8)],
    ['creator', beetSolana.publicKey],
    ['recipient', beetSolana.publicKey],
    ['mint', beetSolana.publicKey],
    ['name', beet.uniformFixedSizeArray(beet.u8, 32)],
    ['totalVestingDuration', beet.u64],
    ['createdTimestamp', beet.u64],
    ['cancelAuthority', authorityBeet],
    ['changeRecipientAuthority', authorityBeet],
    ['vestingType', vestingTypeBeet],
  ],
  ScheduledPayment.fromArgs,
  'ScheduledPayment'
)
