import * as anchor from "@coral-xyz/anchor";

import {
  Account,
  Mint,
  getAccount,
  getAssociatedTokenAddressSync,
  getMint,
} from "@solana/spl-token";
import { Authority, Vault } from "program";
import { Connection, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { displayTime, shortenAddress } from "utils/formatters";

import { DasApiAsset } from "@metaplex-foundation/digital-asset-standard-api";
import { getPDAs } from "utils/constants";

export default class BaseModel {
  key: PublicKey;
  identifier: anchor.BN;
  name: string;
  creator: PublicKey;
  recipient: PublicKey;
  mint: PublicKey;
  autopay: boolean;
  _totalVestingDuration: anchor.BN = new anchor.BN(0);
  _createdTimestamp: anchor.BN = new anchor.BN(0);
  _startDate: anchor.BN = new anchor.BN(0);
  _lastPaymentTimestamp: anchor.BN = new anchor.BN(0);
  _initialDepositAmount: anchor.BN = new anchor.BN(0);
  _totalNumberOfPayouts: anchor.BN = new anchor.BN(0);
  _payoutInterval: anchor.BN = new anchor.BN(0);
  _numberOfPaymentsMade: anchor.BN = new anchor.BN(0);
  _cancelAuthority: Authority;

  das: DasApiAsset;

  creatorAta: Account;
  recipientAta: Account;
  vaultAta: Account;
  mintInfo: Mint;
  tokenProgramId: PublicKey;

  constructor(
    publicKey: PublicKey,
    obj: Vault,
    public connection: anchor.web3.Connection,
  ) {
    this.key = publicKey;
    this.identifier = new anchor.BN(obj.identifier);
    this.name = anchor.utils.bytes.utf8.decode(new Uint8Array(obj.name));
    this.creator = obj.creator;
    this.recipient = obj.recipient;
    this.mint = obj.mint;
    this.autopay = obj.autopay;
    this._totalVestingDuration = new anchor.BN(obj.totalVestingDuration);
    this._createdTimestamp = new anchor.BN(obj.createdTimestamp);
    this._startDate = new anchor.BN(obj.startDate);
    this._lastPaymentTimestamp = new anchor.BN(obj.lastPaymentTimestamp);
    this._initialDepositAmount = new anchor.BN(obj.initialDepositAmount);
    this._payoutInterval = new anchor.BN(obj.payoutInterval);
    this._totalNumberOfPayouts = new anchor.BN(obj.totalNumberOfPayouts);
    this._numberOfPaymentsMade = new anchor.BN(obj.numberOfPaymentsMade);
    this._cancelAuthority = obj.cancelAuthority;
  }

  get paymentsComplete(): boolean {
    return this._numberOfPaymentsMade.gte(this._totalNumberOfPayouts);
  }

  get decimals(): number {
    return this.mintInfo?.decimals;
  }

  get canMint(): boolean {
    return this.mintInfo?.mintAuthority === null;
  }

  get canFreeze(): boolean {
    return this.mintInfo?.freezeAuthority === null;
  }

  get canDisburse(): boolean {
    const currentTime = Math.floor(Date.now() / 1000);
    const startDate = this._startDate.toNumber();
    if (startDate > currentTime) return false;

    if (
      this._lastPaymentTimestamp.add(this._payoutInterval).toNumber() >
      currentTime
    )
      return false;

    return true;
  }

  get cancelAuthority(): string {
    switch (this._cancelAuthority) {
      case Authority.Neither:
        return "No one";
      case Authority.Creator:
        return shortenAddress(this.creator);
      case Authority.Recipient:
        return shortenAddress(this.recipient);
      case Authority.Both:
        return (
          shortenAddress(this.creator) +
          " and " +
          shortenAddress(this.recipient)
        );
    }
  }

  get totalVestingDuration(): number {
    return this._totalVestingDuration.toNumber();
  }

  get numberOfPaymentsMade(): number {
    return this._numberOfPaymentsMade.toNumber();
  }

  get totalNumberOfPayouts(): number {
    return this._totalNumberOfPayouts.toNumber();
  }

  get initialDeposit(): number {
    return this._initialDepositAmount.toNumber() / Math.pow(10, this.decimals);
  }

  get vaultAtaBalance(): anchor.BN {
    return new anchor.BN(this.vaultAta?.amount.toString());
  }

  get vaultAtaBalanceAsNumberPerDecimals(): number {
    return (
      (this.vaultAta &&
        this.vaultAtaBalance &&
        this.vaultAtaBalance
          .div(new anchor.BN(Math.pow(10, this.decimals)))
          .toNumber()) ||
      0
    );
  }

  get lastPaymentTimestamp(): Date {
    const last = new Date(this._lastPaymentTimestamp.toNumber() * 1000);
    return new Date(last.getTime());
  }

  get createdTimestamp(): Date {
    const createdDate = new Date(this._createdTimestamp.toNumber() * 1000);
    return new Date(createdDate.getTime());
  }

  get startDate(): Date {
    const startDate = new Date(this._startDate.toNumber() * 1000);
    return new Date(startDate.getTime());
  }

  get endDate(): Date {
    const startDate = new Date(this._startDate.toNumber() * 1000);
    return new Date(startDate.getTime() + this.totalVestingDuration * 1000);
  }

  get payoutInterval(): string {
    return displayTime(this._payoutInterval.toNumber());
  }

  get payoutIntervalAsNumber(): number {
    return this._payoutInterval.toNumber();
  }

  get nextPayoutDate(): Date {
    return new Date(
      this._lastPaymentTimestamp.toNumber() * 1000 +
        this._payoutInterval.toNumber() * 1000,
    );
  }

  get nextPayoutShortDate(): string {
    return this.nextPayoutDate.toLocaleDateString();
  }

  displayTime(seconds: number): string {
    return displayTime(seconds);
  }

  canCancel(user: PublicKey): boolean {
    switch (this._cancelAuthority) {
      case Authority.Neither:
        return false;
      case Authority.Creator:
        return user.equals(this.creator);
      case Authority.Recipient:
        return user.equals(this.recipient);
      case Authority.Both:
        return user.equals(this.creator) || user.equals(this.recipient);
    }
  }

  async populate(connection: Connection, obj: BaseModel) {
    const pdas = getPDAs(obj.identifier, obj.creator, obj.mint);
    const accountInfo = await connection.getAccountInfo(obj.mint);
    this.tokenProgramId = accountInfo?.owner;
    this.mintInfo = await getMint(
      connection,
      obj.mint,
      undefined,
      this.tokenProgramId,
    );

    this.vaultAta = await getAccount(
      connection,
      pdas.vaultAta,
      undefined,
      this.tokenProgramId,
    );

    try {
      this.creatorAta = await getAccount(
        connection,
        getAssociatedTokenAddressSync(
          obj.mint,
          obj.creator,
          false,
          this.tokenProgramId,
        ),
        undefined,
        this.tokenProgramId,
      );
    } catch (e) {
      console.error(e);
      this.creatorAta = null;
    }

    try {
      this.recipientAta = await getAccount(
        connection,
        getAssociatedTokenAddressSync(
          obj.mint,
          obj.recipient,
          false,
          this.tokenProgramId,
        ),
        undefined,
        this.tokenProgramId,
      );
    } catch (e) {
      console.error(e);
      this.recipientAta = null;
    }
  }
}

export class ValhallaVault extends BaseModel {
  constructor(
    publicKey: PublicKey,
    scheduledPayment: Vault,
    public connection: Connection,
  ) {
    super(publicKey, scheduledPayment, connection);
  }
}

export class ValhallaConfig {
  constructor(
    private _admin: PublicKey,
    private _devTreasury: PublicKey,
    private _daoTreasury: PublicKey,
    private _governanceTokenMintKey: PublicKey,
    private _devFee: anchor.BN,
    private _tokenFeeBasisPoints: anchor.BN,
    private _governanceTokenAmount: anchor.BN,
  ) {}

  get admin(): string {
    return shortenAddress(this._admin);
  }

  get devTreasury(): string {
    return shortenAddress(this._devTreasury);
  }

  get daoTreasury(): string {
    return shortenAddress(this._daoTreasury);
  }

  get governanceTokenMintKey(): string {
    return shortenAddress(this._governanceTokenMintKey);
  }

  get devFee(): number {
    return this._devFee.toNumber() / LAMPORTS_PER_SOL;
  }

  get tokenFeeBasisPoints(): number {
    return this._tokenFeeBasisPoints.toNumber();
  }

  get tokenFeePercentage(): string {
    return (this._tokenFeeBasisPoints.toNumber() / 100).toLocaleString() + "%";
  }

  get governanceTokenAmount(): number {
    return this._governanceTokenAmount.toNumber() / LAMPORTS_PER_SOL;
  }
}
