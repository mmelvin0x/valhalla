use anchor_lang::prelude::*;

#[account]
pub struct Locker {
    pub treasury: Pubkey,
    pub admin: Pubkey,
    pub fee: u64,
}

impl Locker {
    pub const LEN: usize = 8 + 32 + 32 + 8;
}
