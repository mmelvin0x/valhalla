use anchor_lang::prelude::*;

#[account]
pub struct Config {
    pub admin: Pubkey,
    pub treasury: Pubkey,
    pub fee: u64,
}

impl Space for Config {
    const INIT_SPACE: usize = 8 + 32 + 32 + 8;
}
