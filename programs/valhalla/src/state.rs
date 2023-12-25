use anchor_lang::prelude::*;

#[account]
pub struct Lock {
    pub user: Pubkey,
    pub mint: Pubkey,
    pub locked_date: u64,
    pub unlock_date: u64,
}

impl Lock {
    pub const LEN: usize = 8 + 32 + 32 + 8 + 8;
}
