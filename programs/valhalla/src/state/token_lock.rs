use anchor_lang::prelude::*;

use crate::VestingType;

#[account]
pub struct TokenLock {
    pub identifier: u64,
    pub name: [u8; 32],
    pub creator: Pubkey,
    pub recipient: Pubkey,
    pub mint: Pubkey,
    pub total_vesting_duration: u64,
    pub created_timestamp: u64,
    pub vesting_type: VestingType,
    pub token_account_bump: u8,
}

impl Space for TokenLock {
    const INIT_SPACE: usize = 8 + // discriminator
            8 + // identifier
            32 + // name
            32 + // creator
            32 + // recipient
            32 + // mint
            8 + // total_vesting_duration
            8 + // created_timestamp
            1 + // vesting_type
            1; // token_account_bump
}
