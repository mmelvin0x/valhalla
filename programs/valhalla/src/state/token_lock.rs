use anchor_lang::prelude::*;

use crate::VestingType;

#[account]
pub struct TokenLock {
    pub funder: Pubkey,
    pub mint: Pubkey,
    pub name: [u8; 32],
    pub total_vesting_duration: u64,
    pub created_timestamp: u64,
    pub vesting_type: VestingType,
}

impl TokenLock {
    pub fn size_of() -> usize {
        8 + // discriminator
            32 + // funder
            32 + // mint
            32 + // name
            8 + // total_vesting_duration
            8 + // created_timestamp
            1 // vesting_type
    }
}
