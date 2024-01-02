use anchor_lang::prelude::*;

#[account]
pub struct Locker {
    pub treasury: Pubkey,
    pub admin: Pubkey,
    pub fee: u64,
    pub reward_token_mint: Pubkey,
}

impl Locker {
    pub const LEN: usize = 8 + 32 + 32 + 8;
}

#[account]
pub struct Lock {
    pub user: Pubkey,
    pub mint: Pubkey,
    pub reward_token_mint: Pubkey,
    pub lock_token_account: Pubkey,
    pub lock_reward_token_account: Pubkey,
    pub user_token_account: Pubkey,
    pub user_reward_token_account: Pubkey,
    pub locked_date: u64,
    pub unlock_date: u64,
}

impl Lock {
    pub const LEN: usize = 8 + 32 + 32 + 32 + 32 + 32 + 32 + 8 + 8;
}
