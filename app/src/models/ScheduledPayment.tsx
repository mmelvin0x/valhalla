import { Connection, PublicKey } from "@solana/web3.js";

import BaseModel from "./Base.model";
import { ScheduledPayment } from "program";

export class ScheduledPaymentAccount extends BaseModel {
  constructor(
    publicKey: PublicKey,
    scheduledPayment: ScheduledPayment,
    public connection: Connection,
  ) {
    super(publicKey, scheduledPayment, connection);
  }
}
