import type * as anchor from "@coral-xyz/anchor";

import { PublicKey } from "@solana/web3.js";

export const CONFIG_SEED = Buffer.from("config");
export const VAULT_SEED = Buffer.from("vault");
export const VAULT_ATA_SEED = Buffer.from("vault_ata");

export interface ValhallaPDAs {
  config: PublicKey;
  vault: PublicKey;
  vaultAta: PublicKey;
}

export function getPDAs(
  programId: PublicKey,
  identifier?: anchor.BN,
  creator?: PublicKey,
  mint?: PublicKey,
): ValhallaPDAs {
  const [config] = PublicKey.findProgramAddressSync([CONFIG_SEED], programId);

  // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
  if (!identifier || !creator || !mint) {
    return {
      config,
      vault: new PublicKey(0),
      vaultAta: new PublicKey(0),
    };
  }

  const [vault] = PublicKey.findProgramAddressSync(
    [
      identifier.toArrayLike(Buffer, "le", 8),
      creator.toBuffer(),
      mint.toBuffer(),
      VAULT_SEED,
    ],
    programId,
  );

  const [vaultAta] = PublicKey.findProgramAddressSync(
    [vault.toBuffer(), VAULT_ATA_SEED],
    programId,
  );

  return {
    config,
    vault,
    vaultAta,
  };
}
