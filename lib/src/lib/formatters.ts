import * as anchor from "@coral-xyz/anchor";

import { PublicKey } from "@solana/web3.js";
import { isPublicKey } from "@metaplex-foundation/umi";

export const getCronStringFromVault = (interval: number): string => {
  // Define the constants for time in seconds
  const minute = 60;
  const hour = minute * 60;
  const day = hour * 24;
  const week = day * 7;
  const month = day * 30; // Approximation for month

  let cronString = "";

  switch (interval) {
    case minute:
      cronString = "*/1 * * * *"; // Every minute
      break;
    case hour:
      cronString = "0 */1 * * *"; // Every hour
      break;
    case day:
      cronString = "0 0 */1 * *"; // Every day
      break;
    case week:
      cronString = "0 0 * * */1"; // Every week
      break;
    case month:
      cronString = "0 0 1 */1 *"; // Every month
      break;
  }

  return cronString;
};

export const toClosestHour = (date: Date) => {
  const d = new Date(date);
  d.setHours(d.getHours() + 1);
  d.setMinutes(0);
  d.setSeconds(0);
  d.setMilliseconds(0);

  return d;
};

export const shortenNumber = (num: number, digits: number) => {
  const lookup = [
    { value: 1, symbol: "" },
    { value: 1e3, symbol: "k" },
    { value: 1e6, symbol: "M" },
    { value: 1e9, symbol: "G" },
    { value: 1e12, symbol: "T" },
    { value: 1e15, symbol: "P" },
    { value: 1e18, symbol: "E" },
  ];
  const rx = /\.0+$|(\.[0-9]*[1-9])0+$/;
  const item = lookup
    .slice()
    .reverse()
    .find(function (item) {
      return num >= item.value;
    });
  return item
    ? (num / item.value).toFixed(digits).replace(rx, "$1") + item.symbol
    : "0";
};

export const shortenSignature = (signature?: string) => {
  if (!signature) return "";
  return `${signature.slice(0, 4)}...${signature.slice(-4)}`;
};

export const shortenAddress = (address?: PublicKey) => {
  if (!address) return "";
  if (typeof address === "string") {
    if (!isPublicKey(address)) return address;
    address = new PublicKey(address);
  }

  return `${address.toBase58().slice(0, 4)}...${address.toBase58().slice(-4)}`;
};

export const getNumDaysFromMS = (ms: number) => {
  const days = ms / (60 * 60 * 24 * 1000);

  return Math.round(days);
};

export const displayTime = (seconds: number) => {
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

export const getNameArg = (name: string): number[] => {
  const nameArg = [];
  const name_ = anchor.utils.bytes.utf8.encode(name);
  name_.forEach((byte, i) => {
    if (i < 32) {
      nameArg.push(byte);
    }
  });

  // make the nameArg 32 bytes
  if (nameArg.length < 32) {
    const diff = 32 - nameArg.length;
    for (let i = 0; i < diff; i++) {
      nameArg.push(0);
    }
  }

  return nameArg;
};
