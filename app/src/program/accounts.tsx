import {
  Account,
  Mint,
  getAccount,
  getAssociatedTokenAddressSync,
  getMint,
} from "@solana/spl-token";
import { Connection, PublicKey } from "@solana/web3.js";
import Link from "next/link";
import { ReactNode } from "react";
import { getExplorerUrl } from "../utils/explorer";
import { shortenAddress } from "../utils/formatters";
import { scoreTokenLock } from "../utils/score";
import * as anchor from "@coral-xyz/anchor";
import { Valhalla } from "./_valhalla";
import { getLocksByMintFilter, getLocksByUserFilter } from "utils/filters";
import axios from "axios";
import { DasApiAssetContent } from "@metaplex-foundation/digital-asset-standard-api";
import { notify } from "utils/notifications";

export const PROGRAM_ID = new PublicKey(
  "VHDaKPFJHN3c4Vcb1441HotazGQFa4kGoMik9HMRVQh"
);

export const LOCK_SEED = "lock";
export const LOCK_TOKEN_ACCOUNT_SEED = "token";

export const [LOCKER_KEY] = PublicKey.findProgramAddressSync(
  [Buffer.from("locker")],
  PROGRAM_ID
);

export const getLockKey = (userKey: PublicKey, tokenMint: PublicKey) =>
  PublicKey.findProgramAddressSync(
    [userKey.toBuffer(), tokenMint.toBuffer(), Buffer.from(LOCK_SEED)],
    PROGRAM_ID
  )[0];

export const getLockTokenAccountKey = (
  lockKey: PublicKey,
  userKey: PublicKey,
  tokenMint: PublicKey
) =>
  PublicKey.findProgramAddressSync(
    [
      lockKey.toBuffer(),
      userKey.toBuffer(),
      tokenMint.toBuffer(),
      Buffer.from(LOCK_TOKEN_ACCOUNT_SEED),
    ],
    PROGRAM_ID
  )[0];

export const getUserTokenAccountKey = (
  tokenMint: PublicKey,
  userKey: PublicKey
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
    const mint = await getMint(connection, lock.account.mint);
    mints.push(mint);
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
    const userTokenAccountKey = getUserTokenAccountKey(mint.address, userKey);
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
    return this.lockedDate.sub(this.unlockDate).toNumber() > 0;
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