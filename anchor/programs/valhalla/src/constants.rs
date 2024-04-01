use anchor_lang::prelude::*;
use solana_program::native_token::LAMPORTS_PER_SOL;

#[constant]
pub const MIN_SOL_FEE: u64 = (0.001 * LAMPORTS_PER_SOL as f64) as u64;

#[constant]
pub const MAX_BASIS_POINTS: u64 = 10000;

#[constant]
pub const CONFIG_SEED: &[u8] = b"config";

#[constant]
pub const VAULT_SEED: &[u8] = b"vault";

#[constant]
pub const VAULT_ATA_SEED: &[u8] = b"vault_ata";

#[constant]
pub const GOVERNANCE_TOKEN_MINT_SEED: &[u8] = b"governance_token_mint";
