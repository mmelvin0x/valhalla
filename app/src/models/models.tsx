import * as anchor from "@coral-xyz/anchor";

import {
  Account,
  Mint,
  getAccount,
  getAssociatedTokenAddressSync,
  getMint,
} from "@solana/spl-token";
import {
  Authority,
  ScheduledPayment,
  TokenLock,
  VestingSchedule,
  VestingType,
} from "program";
import { Connection, PublicKey } from "@solana/web3.js";
import { displayTime, shortenNumber } from "utils/formatters";

import { DasApiAsset } from "@metaplex-foundation/digital-asset-standard-api";
import { getPDAs } from "utils/constants";

export default class BaseModel {
  cancelAuthority: Authority;
  changeRecipientAuthority: Authority;
  cliffPaymentAmount: anchor.BN = new anchor.BN(0);
  das: DasApiAsset;
  creator: PublicKey;
  creatorTokenAccount: Account;
  id: PublicKey;
  isCliffPaymentDisbursed: boolean;
  lastPaymentTimestamp: anchor.BN = new anchor.BN(0);
  mint: PublicKey;
  mintInfo: Mint;
  name: string;
  payoutInterval: anchor.BN = new anchor.BN(0);
  recipient: PublicKey;
  recipientTokenAccount: Account;
  startDate: anchor.BN = new anchor.BN(0);
  tokenAccount: Account;
  totalVestingDuration: anchor.BN = new anchor.BN(0);
  vestingType: VestingType;
  tokenProgramId: PublicKey;
  numPaymentsMade: number;

  constructor(
    publicKey: PublicKey,
    obj: VestingSchedule | ScheduledPayment | TokenLock,
    public connection: anchor.web3.Connection,
  ) {
    this.id = publicKey;
    this.creator = obj.creator;
    this.mint = obj.mint;
    this.name = anchor.utils.bytes.utf8.decode(new Uint8Array(obj.name));
    this.totalVestingDuration = new anchor.BN(obj.totalVestingDuration);
    this.vestingType = obj.vestingType;
    this.numPaymentsMade = 0;

    if (obj instanceof VestingSchedule || obj instanceof ScheduledPayment) {
      this.cancelAuthority = obj.cancelAuthority;
      this.changeRecipientAuthority = obj.changeRecipientAuthority;
      this.recipient = obj.recipient;
    }

    if (obj instanceof ScheduledPayment || obj instanceof TokenLock) {
      this.startDate = new anchor.BN(obj.createdTimestamp);
    }

    if (obj instanceof VestingSchedule) {
      this.numPaymentsMade = new anchor.BN(obj.numberOfPaymentsMade).toNumber();
      this.lastPaymentTimestamp = new anchor.BN(obj.lastPaymentTimestamp);
      this.payoutInterval = new anchor.BN(obj.payoutInterval);
      this.startDate = new anchor.BN(obj.startDate);
      this.cliffPaymentAmount = new anchor.BN(obj.cliffPaymentAmount);
      this.isCliffPaymentDisbursed = obj.isCliffPaymentDisbursed;
    }
  }

  get paymentsComplete(): boolean {
    if (this.vestingType === VestingType.VestingSchedule) {
      const totalPayments = this.totalVestingDuration.div(this.payoutInterval);
      return this.numPaymentsMade >= totalPayments.toNumber();
    }

    if (this.vestingType === VestingType.ScheduledPayment) {
      return this.numPaymentsMade > 0;
    }

    if (this.vestingType === VestingType.TokenLock) {
      return this.tokenAccount
        ? this.tokenAccountBalance.toNumber() === 0
        : false;
    }
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
    if (startDate < currentTime) {
      switch (this.vestingType) {
        case VestingType.VestingSchedule:
          return (
            this.payoutInterval.toNumber() +
              this.lastPaymentTimestamp.toNumber() <
            currentTime
          );
        case VestingType.ScheduledPayment:
        case VestingType.TokenLock:
          return startDate + this.totalVestingDuration.toNumber() < currentTime;
      }
    }

    return false;
  }

  get tokenAccountBalance(): anchor.BN {
    return new anchor.BN(this.tokenAccount?.amount.toString());
  }

  get tokenAccountBalanceAsNumberPerDecimals(): number {
    return (
      (this.tokenAccount &&
        this.tokenAccountBalance &&
        this.tokenAccountBalance
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
    switch (this.vestingType) {
      case VestingType.VestingSchedule:
        return new Date(
          this.lastPaymentTimestamp.toNumber() * 1000 +
            this.payoutInterval.toNumber() * 1000,
        );

      case VestingType.ScheduledPayment:
      case VestingType.TokenLock:
        return this.endDate;
    }
  }

  get nextPayoutShortDate(): string {
    return this.nextPayoutDate.toLocaleDateString();
  }

  displayTime(seconds: number): string {
    return displayTime(seconds);
  }

  canChangeRecipient(user: PublicKey): boolean {
    if (this.paymentsComplete) return false;

    switch (this.changeRecipientAuthority) {
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

    this.tokenAccount = await getAccount(
      connection,
      obj.vestingType === VestingType.VestingSchedule
        ? pdas.vestingScheduleTokenAccount
        : obj.vestingType === VestingType.TokenLock
          ? pdas.tokenLockTokenAccount
          : pdas.scheduledPaymentTokenAccount,
      undefined,
      this.tokenProgramId,
    );
    this.creatorTokenAccount = await getAccount(
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

    if (obj.recipient) {
      this.recipientTokenAccount = await getAccount(
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
}

export class VestingScheduleAccount extends BaseModel {
  constructor(
    publicKey: PublicKey,
    scheduledPayment: VestingSchedule,
    public connection: Connection,
  ) {
    super(publicKey, scheduledPayment, connection);
  }
}

export class TokenLockAccount extends BaseModel {
  constructor(
    publicKey: PublicKey,
    scheduledPayment: TokenLock,
    public connection: Connection,
  ) {
    super(publicKey, scheduledPayment, connection);
  }
}

export class ScheduledPaymentAccount extends BaseModel {
  constructor(
    publicKey: PublicKey,
    scheduledPayment: ScheduledPayment,
    public connection: Connection,
  ) {
    super(publicKey, scheduledPayment, connection);
  }
}
