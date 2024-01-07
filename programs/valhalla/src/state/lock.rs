use anchor_lang::prelude::*;

#[account]
pub struct Lock {
    pub user: Pubkey,
    pub mint: Pubkey,
    pub lock_token_account: Pubkey,
    pub user_token_account: Pubkey,
    pub user_reward_token_account: Pubkey,
    pub locked_date: u64,
    pub unlock_date: u64,
}

impl Lock {
    pub const LEN: usize = 8 + 32 + 32 + 32 + 32 + 32 + 8 + 8;

    pub fn is_unlocked(&self) -> bool {
        self.unlock_date <= (Clock::get().unwrap().unix_timestamp as u64)
    }
}
