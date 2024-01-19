use anchor_lang::prelude::*;

use crate::types::Authority;

#[account]
pub struct VestingSchedule {
    pub funder: Pubkey,
    pub recipient: Pubkey,
    pub mint: Pubkey,
    pub name: [u8; 32],
    pub total_vesting_duration: u64,
    pub payout_interval: u64,
    pub amount_per_payout: u64,
    pub start_date: u64,
    pub cliff_payment_amount: u64,
    pub created_timestamp: u64,
    pub last_payment_timestamp: u64,
    pub number_of_payments_made: u64,
    pub is_cliff_payment_disbursed: bool,
    pub cancel_authority: Authority,
    pub change_recipient_authority: Authority,
}

impl VestingSchedule {
    pub fn size_of() -> usize {
        8 + // discriminator
            32 + // funder
            32 + // recipient
            32 + // mint
            32 + // name
            8 + // total_vesting_duration
            8 + // payout_interval
            8 + // amount_per_payout
            8 + // start_date
            8 + // cliff_payment_amount
            8 + // created_timestamp
            8 + // last_payment_timestamp
            8 + // number_of_payments_made
            1 + // is_cliff_payment_disbursed
            1 + // cancel_authority
            1 // change_recipient_authority
    }
}
