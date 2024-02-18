import { Connection, PublicKey } from "@solana/web3.js";
import {
  ScheduledPayment,
  TokenLock,
  VestingSchedule,
  VestingType,
} from "program";
import {
  ScheduledPaymentAccount,
  TokenLockAccount,
  VestingScheduleAccount,
} from "models/models";

import { getNameArg } from "./formatters";

export const searchVestingSchedules = async (
  connection: Connection,
  userKey?: PublicKey,
  search = "",
) => {
  const created = await VestingSchedule.gpaBuilder().addFilter(
    "vestingType",
    VestingType.VestingSchedule,
  );

  const recipient = await VestingSchedule.gpaBuilder().addFilter(
    "vestingType",
    VestingType.VestingSchedule,
  );

  if (userKey) {
    created.addFilter("creator", userKey);
    recipient.addFilter("recipient", userKey);
  }

  if (search) {
    created.addFilter("name", getNameArg(search));
    recipient.addFilter("name", getNameArg(search));
  }

  const fMapped = (await created.run(connection)).map((v) => {
    const [vs] = VestingSchedule.fromAccountInfo(v.account);
    return new VestingScheduleAccount(v.pubkey, vs, connection);
  });
  const rMapped = (await recipient.run(connection)).map((v) => {
    const [vs] = VestingSchedule.fromAccountInfo(v.account);
    return new VestingScheduleAccount(v.pubkey, vs, connection);
  });

  return {
    created: fMapped,
    recipient: rMapped,
  };
};

export const searchTokenLocks = async (
  connection: Connection,
  userKey?: PublicKey,
  search = "",
) => {
  const created = await TokenLock.gpaBuilder().addFilter(
    "vestingType",
    VestingType.TokenLock,
  );

  if (userKey) {
    created.addFilter("creator", userKey);
  }

  if (search) {
    created.addFilter("name", getNameArg(search));
  }

  const fMapped = (await created.run(connection)).map((v) => {
    const [vs] = TokenLock.fromAccountInfo(v.account);
    return new TokenLockAccount(v.pubkey, vs, connection);
  });

  return {
    created: fMapped,
  };
};

export const searchScheduledPayments = async (
  connection: Connection,
  userKey?: PublicKey,
  search = "",
) => {
  const created = await VestingSchedule.gpaBuilder().addFilter(
    "vestingType",
    VestingType.ScheduledPayment,
  );
  const recipient = await VestingSchedule.gpaBuilder().addFilter(
    "vestingType",
    VestingType.ScheduledPayment,
  );

  if (userKey) {
    created.addFilter("creator", userKey);
    recipient.addFilter("recipient", userKey);
  }

  if (search) {
    created.addFilter("name", getNameArg(search));
    recipient.addFilter("name", getNameArg(search));
  }

  const fMapped = (await created.run(connection)).map((v) => {
    const [vs] = ScheduledPayment.fromAccountInfo(v.account);
    return new ScheduledPaymentAccount(v.pubkey, vs, connection);
  });

  const rMapped = (await created.run(connection)).map((v) => {
    const [vs] = ScheduledPayment.fromAccountInfo(v.account);
    return new ScheduledPaymentAccount(v.pubkey, vs, connection);
  });

  return {
    created: fMapped,
    recipient: rMapped,
  };
};
