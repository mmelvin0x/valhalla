import { PublicKey } from "@solana/web3.js";

export * from "./program";

export * from "./utils";

export const CONFIG_SEED = Buffer.from("config");
export const VAULT_SEED = Buffer.from("vault");
export const VAULT_ATA_SEED = Buffer.from("vault_ata");
export const GOVERNANCE_TOKEN_MINT_SEED = Buffer.from("governance_token_mint");

export interface ValhallaPDAs {
  config: PublicKey;
  vault?: PublicKey;
  vaultAta?: PublicKey;
}
