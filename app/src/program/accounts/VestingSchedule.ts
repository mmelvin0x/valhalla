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
 * Arguments used to create {@link VestingSchedule}
 * @category Accounts
 * @category generated
 */
export type VestingScheduleArgs = {
  creator: web3.PublicKey
  recipient: web3.PublicKey
  mint: web3.PublicKey
  name: number[] /* size: 32 */
  totalVestingDuration: beet.bignum
  payoutInterval: beet.bignum
  amountPerPayout: beet.bignum
  startDate: beet.bignum
  cliffPaymentAmount: beet.bignum
  createdTimestamp: beet.bignum
  lastPaymentTimestamp: beet.bignum
  numberOfPaymentsMade: beet.bignum
  isCliffPaymentDisbursed: boolean
  cancelAuthority: Authority
  changeRecipientAuthority: Authority
  vestingType: VestingType
}

export const vestingScheduleDiscriminator = [
  130, 200, 173, 148, 39, 75, 243, 147,
]
/**
 * Holds the data for the {@link VestingSchedule} Account and provides de/serialization
 * functionality for that data
 *
 * @category Accounts
 * @category generated
 */
export class VestingSchedule implements VestingScheduleArgs {
  private constructor(
    readonly creator: web3.PublicKey,
    readonly recipient: web3.PublicKey,
    readonly mint: web3.PublicKey,
    readonly name: number[] /* size: 32 */,
    readonly totalVestingDuration: beet.bignum,
    readonly payoutInterval: beet.bignum,
    readonly amountPerPayout: beet.bignum,
    readonly startDate: beet.bignum,
    readonly cliffPaymentAmount: beet.bignum,
    readonly createdTimestamp: beet.bignum,
    readonly lastPaymentTimestamp: beet.bignum,
    readonly numberOfPaymentsMade: beet.bignum,
    readonly isCliffPaymentDisbursed: boolean,
    readonly cancelAuthority: Authority,
    readonly changeRecipientAuthority: Authority,
    readonly vestingType: VestingType
  ) {}

  /**
   * Creates a {@link VestingSchedule} instance from the provided args.
   */
  static fromArgs(args: VestingScheduleArgs) {
    return new VestingSchedule(
      args.creator,
      args.recipient,
      args.mint,
      args.name,
      args.totalVestingDuration,
      args.payoutInterval,
      args.amountPerPayout,
      args.startDate,
      args.cliffPaymentAmount,
      args.createdTimestamp,
      args.lastPaymentTimestamp,
      args.numberOfPaymentsMade,
      args.isCliffPaymentDisbursed,
      args.cancelAuthority,
      args.changeRecipientAuthority,
      args.vestingType
    )
  }

  /**
   * Deserializes the {@link VestingSchedule} from the data of the provided {@link web3.AccountInfo}.
   * @returns a tuple of the account data and the offset up to which the buffer was read to obtain it.
   */
  static fromAccountInfo(
    accountInfo: web3.AccountInfo<Buffer>,
    offset = 0
  ): [VestingSchedule, number] {
    return VestingSchedule.deserialize(accountInfo.data, offset)
  }

  /**
   * Retrieves the account info from the provided address and deserializes
   * the {@link VestingSchedule} from its data.
   *
   * @throws Error if no account info is found at the address or if deserialization fails
   */
  static async fromAccountAddress(
    connection: web3.Connection,
    address: web3.PublicKey,
    commitmentOrConfig?: web3.Commitment | web3.GetAccountInfoConfig
  ): Promise<VestingSchedule> {
    const accountInfo = await connection.getAccountInfo(
      address,
      commitmentOrConfig
    )
    if (accountInfo == null) {
      throw new Error(`Unable to find VestingSchedule account at ${address}`)
    }
    return VestingSchedule.fromAccountInfo(accountInfo, 0)[0]
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
    return beetSolana.GpaBuilder.fromStruct(programId, vestingScheduleBeet)
  }

  /**
   * Deserializes the {@link VestingSchedule} from the provided data Buffer.
   * @returns a tuple of the account data and the offset up to which the buffer was read to obtain it.
   */
  static deserialize(buf: Buffer, offset = 0): [VestingSchedule, number] {
    return vestingScheduleBeet.deserialize(buf, offset)
  }

  /**
   * Serializes the {@link VestingSchedule} into a Buffer.
   * @returns a tuple of the created Buffer and the offset up to which the buffer was written to store it.
   */
  serialize(): [Buffer, number] {
    return vestingScheduleBeet.serialize({
      accountDiscriminator: vestingScheduleDiscriminator,
      ...this,
    })
  }

  /**
   * Returns the byteSize of a {@link Buffer} holding the serialized data of
   * {@link VestingSchedule}
   */
  static get byteSize() {
    return vestingScheduleBeet.byteSize
  }

  /**
   * Fetches the minimum balance needed to exempt an account holding
   * {@link VestingSchedule} data from rent
   *
   * @param connection used to retrieve the rent exemption information
   */
  static async getMinimumBalanceForRentExemption(
    connection: web3.Connection,
    commitment?: web3.Commitment
  ): Promise<number> {
    return connection.getMinimumBalanceForRentExemption(
      VestingSchedule.byteSize,
      commitment
    )
  }

  /**
   * Determines if the provided {@link Buffer} has the correct byte size to
   * hold {@link VestingSchedule} data.
   */
  static hasCorrectByteSize(buf: Buffer, offset = 0) {
    return buf.byteLength - offset === VestingSchedule.byteSize
  }

  /**
   * Returns a readable version of {@link VestingSchedule} properties
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
export const vestingScheduleBeet = new beet.BeetStruct<
  VestingSchedule,
  VestingScheduleArgs & {
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
    ['payoutInterval', beet.u64],
    ['amountPerPayout', beet.u64],
    ['startDate', beet.u64],
    ['cliffPaymentAmount', beet.u64],
    ['createdTimestamp', beet.u64],
    ['lastPaymentTimestamp', beet.u64],
    ['numberOfPaymentsMade', beet.u64],
    ['isCliffPaymentDisbursed', beet.bool],
    ['cancelAuthority', authorityBeet],
    ['changeRecipientAuthority', authorityBeet],
    ['vestingType', vestingTypeBeet],
  ],
  VestingSchedule.fromArgs,
  'VestingSchedule'
)
