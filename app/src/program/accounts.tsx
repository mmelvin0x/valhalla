import {
  Account,
  Mint,
  getAccount,
  getAssociatedTokenAddressSync,
  getMint,
} from "@solana/spl-token";
import { Connection, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import Link from "next/link";
import { ReactNode } from "react";
import { getExplorerUrl } from "../utils/explorer";
import { shortenAddress } from "../utils/formatters";
import { scoreTokenLock } from "../utils/score";
import * as anchor from "@coral-xyz/anchor";
import { Valhalla } from "./valhalla";
import { getLocksByMintFilter, getLocksByUserFilter } from "program/filters";
import axios from "axios";
import { DasApiAssetContent } from "@metaplex-foundation/digital-asset-standard-api";
import { notify } from "utils/notifications";

export const PROGRAM_ID = new PublicKey(
  "D93S1f9iaTDXaLXXeyFVLcXX7wJiCBbk2Jqe1SmbWk2k"
);

export const TREASURY = new PublicKey(
  "AJ7NKueXnNM2sZtBKcf81sMpvyJXENpajLGpdzBKrogJ"
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
    return await getLocksByMint(connection, theMint, program);
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
    console.log("-> ~ lock:", lock.account.userTokenAccount.toBase58());
    const mint = await getMint(connection, lock.account.mint);
    mints.push(mint);
    const lockTokenAccount = await getAccount(
      connection,
      lock.account.lockTokenAccount
    );
    const userTokenAccountKey = getUserTokenAccountKey(
      lock.account.user,
      mint.address
    );
    console.log("-> ~ userTokenAccountKey:", userTokenAccountKey);
    const userTokenAccount = await getAccount(connection, userTokenAccountKey);

    formattedLocks.push(
      new LockAccount(
        lock.publicKey,
        lock.account.lockedDate,
        mint,
        lock.account.unlockDate,
        lock.account.user,
        lockTokenAccount,
        userTokenAccount,
        program.provider.connection.rpcEndpoint
      )
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
    const lockTokenAccount = await getAccount(
      connection,
      lock.account.lockTokenAccount
    );
    const userTokenAccount = await getAccount(
      connection,
      lock.account.userTokenAccount
    );
    formattedLocks.push(
      new LockAccount(
        lock.publicKey,
        lock.account.lockedDate,
        mint,
        lock.account.unlockDate,
        lock.account.user,
        lockTokenAccount,
        userTokenAccount,
        program.provider.connection.rpcEndpoint
      )
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
  connection: Connection,
  mint: Mint,
  program: anchor.Program<Valhalla>
): Promise<LockAccount[]> => {
  const formattedLocks = [];
  const theLocks = await program.account.lock.all([
    getLocksByMintFilter(mint.address),
  ]);

  for (let i = 0; i < theLocks.length; i++) {
    const lock = theLocks[i];
    const lockTokenAccount = await getAccount(
      connection,
      lock.account.lockTokenAccount
    );
    const userTokenAccountKey = getUserTokenAccountKey(
      mint.address,
      lock.account.user
    );
    const userTokenAccount = await getAccount(connection, userTokenAccountKey);

    formattedLocks.push(
      new LockAccount(
        lock.publicKey,
        lock.account.lockedDate,
        mint,
        lock.account.unlockDate,
        lock.account.user,
        lockTokenAccount,
        userTokenAccount,
        program.provider.connection.rpcEndpoint
      )
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
  const lockTokenAccount = await getAccount(connection, lock.lockTokenAccount);
  const userTokenAccountKey = getUserTokenAccountKey(mint.address, lock.user);
  const userTokenAccount = await getAccount(connection, userTokenAccountKey);

  return new LockAccount(
    lockPublicKey,
    lock.lockedDate,
    mint,
    lock.unlockDate,
    lock.user,
    lockTokenAccount,
    userTokenAccount,
    program.provider.connection.rpcEndpoint
  );
};

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

export class LockAccount {
  dasAsset: DasApiAssetContent;

  constructor(
    public publicKey: PublicKey,
    public lockedDate: anchor.BN,
    public mint: Mint,
    public unlockDate: anchor.BN,
    public user: PublicKey,
    public lockTokenAccount: Account,
    public userTokenAccount: Account,
    public endpoint: string = "mainnet-beta"
  ) {}

  setDASAssetContent(dasAsset: DasApiAssetContent) {
    this.dasAsset = dasAsset;
  }

  get canUnlock(): boolean {
    const now = new Date().getTime() / 1000;
    return this.unlockDate.toNumber() <= now;
  }

  get daysUntilUnlock(): string {
    return `${(this.unlockDate.sub(this.lockedDate).toNumber() / 86400).toFixed(
      2
    )} days`;
  }

  get displayPublicKey(): string {
    return shortenAddress(this.publicKey);
  }

  get displayLockDate(): string {
    return new Date(this.lockedDate.toNumber() * 1000).toLocaleDateString();
  }

  get displayMint(): ReactNode {
    return (
      <Link
        className="link link-secondary"
        href={getExplorerUrl(this.endpoint, this.mint.address, "token")}
        target="_blank"
        rel="noreferrer noopener"
      >
        {shortenAddress(this.mint.address)}
      </Link>
    );
  }

  get displayUnlockDate(): string {
    return new Date(this.unlockDate.toNumber() * 1000).toLocaleDateString();
  }

  get displayUser(): ReactNode {
    return (
      <Link
        className="link link-secondary"
        href={getExplorerUrl(this.endpoint, this.user)}
        target="_blank"
        rel="noreferrer noopener"
      >
        {shortenAddress(this.user)}
      </Link>
    );
  }

  get percentLocked(): number {
    const amountLocked = Number(
      this.lockTokenAccount.amount / BigInt(10 ** this.mint.decimals)
    );
    const supply = Number(this.mint.supply / BigInt(10 ** this.mint.decimals));
    return amountLocked / supply;
  }

  get displayPercentLocked(): string {
    return `${(this.percentLocked * 100).toFixed(2)}%`;
  }

  get canMint(): boolean {
    return this.mint.mintAuthority !== null;
  }

  get canFreeze(): boolean {
    return this.mint.freezeAuthority !== null;
  }

  get score(): string {
    return scoreTokenLock({
      lockLength: this.unlockDate.sub(this.lockedDate).toNumber(),
      percentOfSupplyLocked: this.percentLocked,
      freezeAuthorityRenounced: !this.canFreeze,
      mintAuthorityRenounced: !this.canMint,
    });
  }
}
