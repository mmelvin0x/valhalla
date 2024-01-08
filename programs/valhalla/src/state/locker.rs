use anchor_lang::prelude::*;

#[account]
pub struct Locker {
    pub fee: u64,
    pub admin: Pubkey,
    pub treasury: Pubkey,
    pub reward_token_mint: Pubkey,
}
