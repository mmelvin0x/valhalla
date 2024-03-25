import * as anchor from "@coral-xyz/anchor";

import { PublicKey } from "@solana/web3.js";
import { isPublicKey } from "@metaplex-foundation/umi";

import BN = require("bn.js");

export const secondsToCronString = (seconds: BN) => {
  // Convert seconds to minutes; if less than 60 seconds, run every minute
  const sixty = new BN(60);
  const minutes = Math.max(Math.floor(seconds.div(sixty).toNumber()), 1);

  // Generate cron string
  // For inputs resulting in an interval of more than 60 minutes or not evenly dividing into 60,
  // it defaults to every minute due to cron limitations.
  let cronString;
  if (minutes <= 60 && 60 % minutes === 0) {
    cronString = `*/${minutes} * * * *`;
  } else {
    cronString = "* * * * *";
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
