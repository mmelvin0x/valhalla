import * as anchor from "@coral-xyz/anchor";

import { PublicKey } from "@solana/web3.js";

export const CONFIG_SEED = Buffer.from("config");
export const VAULT_SEED = Buffer.from("vault");
export const VAULT_ATA_SEED = Buffer.from("vault_ata");

export interface ValhallaPDAs {
  config: PublicKey;
  vault: PublicKey;
  vaultAta: PublicKey;
  tokenAccountBump: number;
}

export function getPDAs(
  programId: PublicKey,
  identifier?: anchor.BN,
  creator?: PublicKey,
  recipient?: PublicKey,
  mint?: PublicKey
): ValhallaPDAs {
  const [config] = PublicKey.findProgramAddressSync([CONFIG_SEED], programId);

  if (!identifier || !creator || !recipient || !mint) {
    return {
      config,
      vault: new PublicKey(0),
      vaultAta: new PublicKey(0),
      tokenAccountBump: 0,
    };
  }

  const [vault] = PublicKey.findProgramAddressSync(
    [
      identifier.toArrayLike(Buffer, "le", 8),
      creator.toBuffer(),
      recipient.toBuffer(),
      mint.toBuffer(),
      VAULT_SEED,
    ],
    programId
  );

  const [vaultAta, tokenAccountBump] = PublicKey.findProgramAddressSync(
    [identifier.toArrayLike(Buffer, "le", 8), vault.toBuffer(), VAULT_ATA_SEED],
    programId
  );

  return {
    config,
    vault,
    vaultAta,
    tokenAccountBump,
  };
}
