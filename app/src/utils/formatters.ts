import { PublicKey } from "@solana/web3.js";

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
