import {
  Account,
  Mint,
  TOKEN_2022_PROGRAM_ID,
  getAccount,
  getAssociatedTokenAddressSync,
  getMint,
} from "@solana/spl-token";
import { Connection, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { shortenAddress } from "../utils/formatters";
import * as anchor from "@coral-xyz/anchor";
import { Valhalla } from "./valhalla";
import { getLocksByMintFilter, getLocksByUserFilter } from "program/filters";
import axios from "axios";
import { DasApiAssetContent } from "@metaplex-foundation/digital-asset-standard-api";
import { notify } from "utils/notifications";

export const PROGRAM_ID = new PublicKey(
  "BgfvN8xjwoBD8YDvpDAFPZW6QxJeqrEZWvoXGg21PVzU"
);

export const TREASURY = new PublicKey(
  "5q3JmFVTcvn2GHo5zurZbTs1p8c2zsivFLeZAHz78ppb"
);

export const LOCK_SEED = Buffer.from("lock");
export const LOCKER_SEED = Buffer.from("locker");
export const LOCK_TOKEN_ACCOUNT_SEED = Buffer.from("token");

export const getLockerKey = (): PublicKey => {
  const [locker] = PublicKey.findProgramAddressSync([LOCKER_SEED], PROGRAM_ID);

  return locker;
};

export const getLockKey = (user: PublicKey, mint: PublicKey): PublicKey => {
  const [lock] = PublicKey.findProgramAddressSync(
    [user.toBuffer(), mint.toBuffer(), LOCK_SEED],
    PROGRAM_ID
  );

  return lock;
};

export const getLockTokenAccountKey = (
  lock: PublicKey,
  user: PublicKey,
  mint: PublicKey
) => {
  const [lockTokenAccount] = PublicKey.findProgramAddressSync(
    [
      lock.toBuffer(),
      user.toBuffer(),
      mint.toBuffer(),
      LOCK_TOKEN_ACCOUNT_SEED,
    ],
    PROGRAM_ID
  );

  return lockTokenAccount;
};

export const getUserTokenAccountKey = (
  userKey: PublicKey,
  tokenMint: PublicKey
) => {
  return getAssociatedTokenAddressSync(tokenMint, userKey);
};

export const getAllLocks = async (
  connection: Connection,
  program: anchor.Program<Valhalla>,
  search: string,
  cursor: PublicKey | null = null
): Promise<LockAccount[]> => {
  let mint: PublicKey | null = null;
  if (search) {
    try {
      mint = new PublicKey(search);
    } catch (err) {
      console.error(err);
      notify({
        message: "Invalid mint address",
        type: "error",
      });
    }
  }

  if (mint) {
    const theMint = await getMint(connection, mint);
    return await getLocksByMint(theMint, program);
  }

  const filters: any[] = [{ dataSize: 152 }];

  if (cursor) {
    filters.push({ memcmp: { offset: 0, bytes: cursor.toBase58() } });
  }

  const mints = [];
  const formattedLocks = [];
  const theLocks = await program.account.lock.all();
  for (let i = 0; i < theLocks.length; i++) {
    const lock = theLocks[i];
    const mint = await getMint(connection, lock.account.mint);
    mints.push(mint);

    formattedLocks.push(
      new LockAccount(lock, mint, program.provider.connection.rpcEndpoint)
    );
  }

  const { data: tokenMetadatas } = await axios.post<
    Array<DasApiAssetContent & { id: string }>
  >("/api/getMetadataByMints", {
    mints: mints.map((mint) => mint.address.toBase58()),
  });

  formattedLocks.forEach((lock) => {
    const dasAsset = tokenMetadatas.find(
      (tokenMetadata) => tokenMetadata.id === lock.mint.address.toBase58()
    );

    lock.setDASAssetContent(dasAsset);
  });

  return formattedLocks;
};

export const getLocksByUser = async (
  connection: Connection,
  userKey: PublicKey,
  program: anchor.Program<Valhalla>
): Promise<LockAccount[]> => {
  const mints = [];
  const formattedLocks = [];
  const theLocks = await program.account.lock.all([
    getLocksByUserFilter(userKey),
  ]);

  for (let i = 0; i < theLocks.length; i++) {
    const lock = theLocks[i];
    const mint = await getMint(connection, lock.account.mint);
    mints.push(mint);

    formattedLocks.push(
      new LockAccount(lock, mint, program.provider.connection.rpcEndpoint)
    );
  }

  const { data: tokenMetadatas } = await axios.post<
    Array<DasApiAssetContent & { id: string }>
  >("/api/getMetadataByMints", {
    mints: mints.map((mint) => mint.address.toBase58()),
  });

  formattedLocks.forEach((lock) => {
    const dasAsset = tokenMetadatas.find(
      (tokenMetadata) => tokenMetadata.id === lock.mint.address.toBase58()
    );

    lock.setDASAssetContent(dasAsset);
  });

  return formattedLocks;
};

export const getLocksByMint = async (
  mint: Mint,
  program: anchor.Program<Valhalla>
): Promise<LockAccount[]> => {
  const formattedLocks = [];
  const theLocks = await program.account.lock.all([
    getLocksByMintFilter(mint.address),
  ]);

  for (let i = 0; i < theLocks.length; i++) {
    const lock = theLocks[i];

    formattedLocks.push(
      new LockAccount(lock, mint, program.provider.connection.rpcEndpoint)
    );
  }

  const { data: tokenMetadatas } = await axios.post<
    Array<DasApiAssetContent & { id: string }>
  >("/api/getMetadataByMints", { mints: [mint.address.toBase58()] });

  formattedLocks.forEach((lock) => {
    const dasAsset = tokenMetadatas.find(
      (tokenMetadata) => tokenMetadata.id === lock.mint.address.toBase58()
    );

    lock.setDASAssetContent(dasAsset);
  });

  return formattedLocks;
};

export const getLockByPublicKey = async (
  connection: Connection,
  program: anchor.Program<Valhalla>,
  lockPublicKey: PublicKey
): Promise<LockAccount> => {
  const lock = await program.account.lock.fetch(lockPublicKey);
  const mint = await getMint(connection, lock.mint);

  return new LockAccount(lock, mint, program.provider.connection.rpcEndpoint);
};

export class LockAccount {
  PROGRAM_ID = PROGRAM_ID;

  lockKey: PublicKey;
  tokenAccount: Account;
  dasAsset: DasApiAssetContent;
  funder: PublicKey;
  beneficiary: PublicKey;
  cancelAuthority: PublicKey[];
  changeRecipientAuthority: PublicKey[];
  vestingDuration: number;
  payoutInterval: number;
  amountPerPayout: number;
  startDate: number;
  cliffPaymentAmount: number;
  lastPaymentTimestamp: number;

  constructor(
    public lock: any,
    public mint: Mint,
    public endpoint: string = "mainnet-beta"
  ) {
    this.lockKey = new PublicKey(lock.publicKey);
    this.funder = new PublicKey(lock.account.funder);
    this.beneficiary = new PublicKey(lock.account.beneficiary);
    this.mint = mint;
    this.cancelAuthority = [
      new PublicKey(lock.account.cancelAuthority[0]),
      new PublicKey(lock.account.cancelAuthority[1]),
    ];
    this.changeRecipientAuthority = [
      new PublicKey(lock.account.changeRecipientAuthority[0]),
      new PublicKey(lock.account.changeRecipientAuthority[1]),
    ];
    this.vestingDuration = lock.account.vestingDuration;
    this.payoutInterval = lock.account.payoutInterval;
    this.amountPerPayout = lock.account.amountPerPayout / LAMPORTS_PER_SOL;
    this.startDate = lock.account.startDate;
    this.cliffPaymentAmount =
      lock.account.cliffPaymentAmount / LAMPORTS_PER_SOL;
    this.lastPaymentTimestamp = lock.account.lastPaymentTimestamp;
  }

  setDASAssetContent(dasAsset: DasApiAssetContent) {
    this.dasAsset = dasAsset;
  }

  async populateTokenAccount(connection: Connection): Promise<Account> {
    const [key] = PublicKey.findProgramAddressSync(
      [
        this.lockKey.toBuffer(),
        this.funder.toBuffer(),
        this.mint.address.toBuffer(),
        LOCK_TOKEN_ACCOUNT_SEED,
      ],
      this.PROGRAM_ID
    );

    try {
      const account = await getAccount(connection, key);
      this.tokenAccount = account;
      return account;
    } catch (err) {
      console.error(err);
      console.log("Trying Token2022");
      const account = await getAccount(
        connection,
        key,
        undefined,
        TOKEN_2022_PROGRAM_ID
      );
      this.tokenAccount = account;
      return account;
    }
  }
}

export class LockerAccount {
  constructor(
    public publicKey: PublicKey,
    public admin: PublicKey,
    public treasury: PublicKey,
    public fee: anchor.BN
  ) {}

  get displayPublicKey(): string {
    return shortenAddress(this.publicKey);
  }

  get displayAdmin(): string {
    return shortenAddress(this.admin);
  }

  get displayTreasury(): string {
    return shortenAddress(this.treasury);
  }

  get displayFee(): string {
    return this.fee
      .div(new anchor.BN(LAMPORTS_PER_SOL))
      .toNumber()
      .toLocaleString();
  }
}
