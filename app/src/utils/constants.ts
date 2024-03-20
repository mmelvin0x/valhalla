import * as anchor from "@coral-xyz/anchor";

import { PROGRAM_ID } from "program";
import { PublicKey } from "@solana/web3.js";

export enum SubType {
  Created,
  Receivable,
}

export const ODIN_MINT_ADDRESS = new PublicKey(
  "GPZHuXHxa3sZqzzbzk2bkLkTzHet6V3ximdMCLJufp3u",
);

export const SOL_TREASURY = new PublicKey(process.env.NEXT_PUBLIC_SOL_TREASURY);
export const TOKEN_TREASURY = new PublicKey(
  process.env.NEXT_PUBLIC_TOKEN_TREASURY,
);

export const CONFIG_SEED = Buffer.from("config");
export const VAULT_SEED = Buffer.from("vault");
export const VAULT_ATA_SEED = Buffer.from("vault_ata");
export const GOVERNANCE_TOKEN_MINT_SEED = Buffer.from("governance_token_mint");

interface ValhallaPDAs {
  config: PublicKey;
  vault?: PublicKey;
  vaultAta?: PublicKey;
}

export function getPDAs(
  identifier: anchor.BN,
  creator: PublicKey,
  mint: PublicKey,
): ValhallaPDAs {
  const [config] = PublicKey.findProgramAddressSync([CONFIG_SEED], PROGRAM_ID);

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
    PROGRAM_ID,
  );

  const [vaultAta] = PublicKey.findProgramAddressSync(
    [vault.toBuffer(), VAULT_ATA_SEED],
    PROGRAM_ID,
  );

  return {
    config,
    vault,
    vaultAta,
  };
}
