import { PublicKey } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";

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
  var item = lookup
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
  return `${address.toBase58().slice(0, 4)}...${address.toBase58().slice(-4)}`;
};

export const getNumDaysFromMS = (ms: number) => {
  const days = ms / (60 * 60 * 24 * 1000);

  return Math.round(days);
};

export const displayTime = (seconds: number) => {
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
  let nameArg = [];
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
