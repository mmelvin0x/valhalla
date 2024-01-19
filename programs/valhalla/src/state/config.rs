use anchor_lang::prelude::*;

#[account]
pub struct Config {
    pub admin: Pubkey,
    pub treasury: Pubkey,
    pub fee: u64,
}

impl Config {
    pub fn size_of() -> usize {
        8 + 32 + 32 + 8
    }
}
