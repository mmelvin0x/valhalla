import { Connection, PublicKey } from "@solana/web3.js";

import BaseModel from "./Base.model";
import { TokenLock } from "program";

export class TokenLockAccount extends BaseModel {
  constructor(
    publicKey: PublicKey,
    scheduledPayment: TokenLock,
    public connection: Connection,
  ) {
    super(publicKey, scheduledPayment, connection);
  }
}
