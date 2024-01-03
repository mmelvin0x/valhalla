import {
  Account,
  Mint,
  getAccount,
  getAssociatedTokenAddressSync,
  getMint,
} from "@solana/spl-token";
import { Connection, PublicKey } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import { Valhalla } from "./valhalla";
import { DasApiAssetContent } from "@metaplex-foundation/digital-asset-standard-api";
import axios from "axios";
import { getLocksByMintFilter, getLocksByUserFilter } from "./filters";
import { scoreTokenLock } from "./score";

export const PROGRAM_ID = new PublicKey(
  "VHK5bbtGpSNyJoRca8kt3fne9cWLsqAAZgVEg6Ww3Lq"
);

export const LOCK_SEED = "lock";
export const LOCK_TOKEN_ACCOUNT_SEED = "token";
export const REWARD_MINT_SEED = "reward";

export const [REWARD_TOKEN_MINT_KEY] = PublicKey.findProgramAddressSync(
  [Buffer.from("reward")],
  PROGRAM_ID
);

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

export const getUserRewardTokenAccountKey = (userKey: PublicKey) => {
  return getAssociatedTokenAddressSync(REWARD_TOKEN_MINT_KEY, userKey);
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

    if (dasAsset) {
      lock.setDASAssetContent(dasAsset);
    }
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

    if (dasAsset) {
      lock.setDASAssetContent(dasAsset);
    }
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

    if (dasAsset) {
      lock.setDASAssetContent(dasAsset);
    }
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

export class LockAccount {
  dasAsset: DasApiAssetContent | undefined;

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

  get daysUntilUnlock(): string {
    return `${(this.unlockDate.sub(this.lockedDate).toNumber() / 86400).toFixed(
      2
    )} days`;
  }

  get displayUnlockDate(): string {
    return new Date(this.unlockDate.toNumber() * 1000).toLocaleDateString();
  }

  get displayLockedDate(): string {
    return new Date(this.lockedDate.toNumber() * 1000).toLocaleDateString();
  }

  get displayUser(): string {
    return this.user.toBase58();
  }

  get percentLocked(): number {
    const amountLocked = Number(
      this.lockTokenAccount.amount / BigInt(10 ** this.mint.decimals)
    );
    const supply = Number(this.mint.supply / BigInt(10 ** this.mint.decimals));

    return (amountLocked * 100) / supply;
  }

  get displayPercentLocked(): string {
    return `${this.percentLocked.toFixed(2)}%`;
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
