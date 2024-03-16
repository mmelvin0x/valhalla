import * as anchor from "@coral-xyz/anchor";

import {
  Account,
  Mint,
  getAccount,
  getAssociatedTokenAddressSync,
  getMint,
} from "@solana/spl-token";
import { Authority, Vault } from "program";
import { Connection, PublicKey } from "@solana/web3.js";

import { DasApiAsset } from "@metaplex-foundation/digital-asset-standard-api";
import { displayTime } from "utils/formatters";
import { getPDAs } from "utils/constants";

export default class BaseModel {
  key: PublicKey;
  identifier: anchor.BN;
  name: string;
  creator: PublicKey;
  recipient: PublicKey;
  mint: PublicKey;
  totalVestingDuration: anchor.BN = new anchor.BN(0);
  createdTimestamp: anchor.BN = new anchor.BN(0);
  startDate: anchor.BN = new anchor.BN(0);
  lastPaymentTimestamp: anchor.BN = new anchor.BN(0);
  initialDepositAmount: anchor.BN = new anchor.BN(0);
  totalNumberOfPayouts: anchor.BN = new anchor.BN(0);
  payoutInterval: anchor.BN = new anchor.BN(0);
  numberOfPaymentsMade: anchor.BN = new anchor.BN(0);
  cancelAuthority: Authority;

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
    this.name = obj.name;
    this.creator = obj.creator;
    this.recipient = obj.recipient;
    this.mint = obj.mint;
    this.totalVestingDuration = new anchor.BN(obj.totalVestingDuration);
    this.createdTimestamp = new anchor.BN(obj.createdTimestamp);
    this.startDate = new anchor.BN(obj.startDate);
    this.lastPaymentTimestamp = new anchor.BN(obj.lastPaymentTimestamp);
    this.initialDepositAmount = new anchor.BN(obj.initialDepositAmount);
    this.payoutInterval = new anchor.BN(obj.payoutInterval);
    this.totalNumberOfPayouts = new anchor.BN(obj.totalNumberOfPayouts);
    this.numberOfPaymentsMade = new anchor.BN(obj.numberOfPaymentsMade);
    this.cancelAuthority = obj.cancelAuthority;
  }

  get paymentsComplete(): boolean {
    return this.numberOfPaymentsMade.gte(this.totalNumberOfPayouts);
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
    if (this.paymentsComplete) return false;

    const currentTime = Math.floor(Date.now() / 1000);
    const startDate = this.startDate.toNumber();
    if (currentTime < startDate) return false;
    if (
      this.lastPaymentTimestamp.add(this.payoutInterval).toNumber() >
      currentTime
    )
      return false;

    return false;
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

  get endDate(): Date {
    const startDate = new Date(this.startDate.toNumber() * 1000);
    return new Date(
      startDate.getTime() + this.totalVestingDuration.toNumber() * 1000,
    );
  }

  get nextPayoutDate(): Date {
    return new Date(
      this.lastPaymentTimestamp.toNumber() * 1000 +
        this.payoutInterval.toNumber() * 1000,
    );
  }

  get nextPayoutShortDate(): string {
    return this.nextPayoutDate.toLocaleDateString();
  }

  displayTime(seconds: number): string {
    return displayTime(seconds);
  }

  canCancel(user: PublicKey): boolean {
    switch (this.cancelAuthority) {
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
    const pdas = getPDAs(obj.creator, obj.recipient, obj.mint);
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
