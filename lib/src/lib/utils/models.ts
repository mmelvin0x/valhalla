import * as anchor from "@coral-xyz/anchor";

import {
  Account,
  Mint,
  TOKEN_2022_PROGRAM_ID,
  getAccount,
  getAssociatedTokenAddressSync,
  getMint,
} from "@solana/spl-token";
import { Connection, PublicKey } from "@solana/web3.js";

import { Authority } from "../program/types";
import { DasApiAsset } from "@metaplex-foundation/digital-asset-standard-api";
import { PROGRAM_ID } from "../program";
import { Vault } from "../program/accounts";
import { displayTime } from "./formatters";
import { getPDAs } from "./getPDAs";

export class ValhallaVault {
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

  das: DasApiAsset | null = null;

  creatorAta: Account | null = null;
  recipientAta: Account | null = null;
  recipientAtaAddress: PublicKey | null = null;
  vaultAta: Account | null = null;
  mintInfo: Mint | null = null;
  tokenProgramId: PublicKey | null = null;

  constructor(
    publicKey: PublicKey,
    obj: Vault,
    public connection: anchor.web3.Connection
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

  get isToken2022(): boolean {
    return this.tokenProgramId?.equals(TOKEN_2022_PROGRAM_ID);
  }

  get paymentsComplete(): boolean {
    return this._numberOfPaymentsMade.gte(this._totalNumberOfPayouts);
  }

  get decimals(): number | null {
    return this.mintInfo?.decimals || null;
  }

  get canMint(): boolean {
    return this.mintInfo?.mintAuthority === null;
  }

  get canFreeze(): boolean {
    return this.mintInfo?.freezeAuthority === null;
  }

  get canDisburse(): boolean {
    if (this.paymentsComplete) return false;

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
      case Authority.Creator:
        return "Creator";
      case Authority.Recipient:
        return "Recipient";
      case Authority.Both:
        return "Creator and Recipient";
      case Authority.Neither:
      default:
        return "None";
    }
  }

  get totalVestingDuration(): number {
    return this._totalVestingDuration.toNumber() * 1000;
  }

  get numberOfPaymentsMade(): number {
    return this._numberOfPaymentsMade.toNumber();
  }

  get totalNumberOfPayouts(): number {
    return this._totalNumberOfPayouts.toNumber();
  }

  get initialDeposit(): number {
    if (!this._initialDepositAmount || !this.decimals) return 0;
    return this._initialDepositAmount.toNumber() / Math.pow(10, this.decimals);
  }

  get vaultAtaBalance(): anchor.BN {
    return new anchor.BN(this.vaultAta?.amount.toString());
  }

  get vaultAtaBalanceAsNumberPerDecimals(): number {
    return (
      (this.decimals &&
        this.vaultAta &&
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
    return this.displayTime(this._payoutInterval.toNumber());
  }

  get payoutIntervalAsNumberInMS(): number {
    return this._payoutInterval.toNumber() * 1000;
  }

  get nextPayoutDate(): Date {
    return new Date(
      this._lastPaymentTimestamp.toNumber() * 1000 +
        this._payoutInterval.toNumber() * 1000
    );
  }

  get nextPayoutShortDate(): string {
    return this.nextPayoutDate.toLocaleDateString();
  }

  displayTime(seconds: number): string {
    return displayTime(seconds);
  }

  canClose(user: PublicKey | null): boolean {
    if (!user) return false;

    return this.paymentsComplete && user.equals(this.creator);
  }

  canCancel(user: PublicKey | null): boolean {
    if (!user) return false;

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

  async populate(connection: Connection, obj: ValhallaVault) {
    const pdas = getPDAs(PROGRAM_ID, obj.identifier, obj.creator, obj.mint);
    const accountInfo = await connection.getAccountInfo(obj.mint);
    this.tokenProgramId = accountInfo?.owner || null;

    if (this.tokenProgramId) {
      this.mintInfo = await getMint(
        connection,
        obj.mint,
        undefined,
        this.tokenProgramId
      );

      this.vaultAta = await getAccount(
        connection,
        pdas.vaultAta,
        undefined,
        this.tokenProgramId
      );

      try {
        this.creatorAta = await getAccount(
          connection,
          getAssociatedTokenAddressSync(
            obj.mint,
            obj.creator,
            false,
            this.tokenProgramId
          ),
          undefined,
          this.tokenProgramId
        );
      } catch (e) {
        console.error(e);
        this.creatorAta = null;
      }

      try {
        this.recipientAtaAddress = getAssociatedTokenAddressSync(
          obj.mint,
          obj.recipient,
          false,
          this.tokenProgramId
        );
        this.recipientAta = await getAccount(
          connection,
          this.recipientAtaAddress,
          undefined,
          this.tokenProgramId
        );
      } catch (e) {
        console.error(e);
        this.recipientAta = null;
      }
    }
  }
}

export class ValhallaConfig {
  admin: PublicKey;
  devTreasury: PublicKey;
  daoTreasury: PublicKey;
  governanceTokenMintKey: PublicKey;
  devFee: anchor.BN;
  autopayMultiplier: anchor.BN;
  tokenFeeBasisPoints: anchor.BN;
  governanceTokenAmount: anchor.BN;

  constructor(
    admin: PublicKey,
    devTreasury: PublicKey,
    daoTreasury: PublicKey,
    governanceTokenMintKey: PublicKey,
    devFee: anchor.BN,
    autopayMultiplier: anchor.BN,
    tokenFeeBasisPoints: anchor.BN,
    governanceTokenAmount: anchor.BN
  ) {
    this.admin = admin;
    this.devTreasury = devTreasury;
    this.daoTreasury = daoTreasury;
    this.governanceTokenMintKey = governanceTokenMintKey;
    this.devFee = devFee;
    this.autopayMultiplier = autopayMultiplier;
    this.tokenFeeBasisPoints = tokenFeeBasisPoints;
    this.governanceTokenAmount = governanceTokenAmount;
  }
}
