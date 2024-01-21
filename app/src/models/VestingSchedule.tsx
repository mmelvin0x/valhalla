import { Connection, PublicKey } from "@solana/web3.js";

import BaseModel from "./Base.model";
import { VestingSchedule } from "program";

export class VestingScheduleAccount extends BaseModel {
  constructor(
    publicKey: PublicKey,
    scheduledPayment: VestingSchedule,
    public connection: Connection,
  ) {
    super(publicKey, scheduledPayment, connection);
  }
}
