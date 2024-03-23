import type * as beet from "@metaplex-foundation/beet";
import { type Vault } from "./program";

export function canDisburseVault(vault: Vault): boolean {
  const currentTime = Math.floor(Date.now() / 1000);
  const payoutInterval = Number(vault.payoutInterval);
  const lastPaymentTimestamp = Number(vault.lastPaymentTimestamp);
  const totalNumberOfPayouts = Number(vault.totalNumberOfPayouts);
  const startDate = Number(vault.startDate);
  const endDate = totalNumberOfPayouts * payoutInterval;

  if (endDate > currentTime) return false;

  return (
    startDate <= currentTime &&
    lastPaymentTimestamp + payoutInterval <= currentTime
  );
}

export const displayTime = (seconds: number): string => {
  if (seconds <= 0) return "Now";

  const SECONDS_IN_MINUTE = 60;
  const SECONDS_IN_HOUR = 3600;
  const SECONDS_IN_DAY = 86400;
  const SECONDS_IN_WEEK = 604800;
  const SECONDS_IN_MONTH = 2629800; // Average month length in seconds

  if (seconds < SECONDS_IN_MINUTE) {
    return `${seconds.toFixed(2)} Second(s)`;
  } else if (seconds < SECONDS_IN_HOUR) {
    return `${(seconds / SECONDS_IN_MINUTE).toFixed(2)} Minute(s)`;
  } else if (seconds < SECONDS_IN_DAY) {
    return `${(seconds / SECONDS_IN_HOUR).toFixed(2)} Hour(s)`;
  } else if (seconds < SECONDS_IN_WEEK) {
    return `${(seconds / SECONDS_IN_DAY).toFixed(2)} Day(s)`;
  } else if (seconds < SECONDS_IN_MONTH) {
    return `${(seconds / SECONDS_IN_WEEK).toFixed(2)} Week(s)`;
  } else {
    return `${(seconds / SECONDS_IN_MONTH).toFixed(2)} Month(s)`;
  }
};

export function cronFromPayoutInterval(payoutInterval: beet.bignum): string {
  return `*/${payoutInterval.toString()} * * * * *`;
}
