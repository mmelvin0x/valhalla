use anchor_lang::prelude::*;

use crate::types::Authority;

#[account]
pub struct ScheduledPayment {
    pub funder: Pubkey,
    pub recipient: Pubkey,
    pub mint: Pubkey,
    pub name: [u8; 32],
    pub total_vesting_duration: u64,
    pub created_timestamp: u64,
    pub cancel_authority: Authority,
    pub change_recipient_authority: Authority,
}

impl ScheduledPayment {
    pub fn size_of() -> usize {
        8 + // discriminator
            32 + // funder
            32 + // recipient
            32 + // mint
            32 + // name
            8 + // total_vesting_duration
            8 + // created_timestamp
            1 + // cancel_authority
            1 // change_recipient_authority
    }
}
