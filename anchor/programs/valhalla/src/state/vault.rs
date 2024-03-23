use anchor_lang::prelude::*;

use crate::types::Authority;

#[account]
pub struct Vault {
    pub identifier: u64,
    pub name: [u8; 32],
    pub creator: Pubkey,
    pub recipient: Pubkey,
    pub mint: Pubkey,
    pub total_vesting_duration: u64,
    pub created_timestamp: u64,
    pub start_date: u64,
    pub last_payment_timestamp: u64,
    pub initial_deposit_amount: u64,
    pub total_number_of_payouts: u64,
    pub payout_interval: u64,
    pub number_of_payments_made: u64,
    pub cancel_authority: Authority,
    pub autopay: bool,
    pub token_account_bump: u8,
}

impl Space for Vault {
    const INIT_SPACE: usize = 8 + // discriminator
            8 + // identifier
            32 + // name
            32 + // creator
            32 + // recipient
            32 + // mint
            8 + // total_vesting_duration
            8 + // created_timestamp
            8 + // start_date
            8 + // last_payment_timestamp
            8 + // initial_deposit_amount
            8 + // total_number_of_payouts
            8 + // payout_interval
            8 + // number_of_payments_made
            1 + // cancel_authority
            1 + // autopay
            1; // token_account_bump
}

impl<'info> Vault {
    pub fn is_locked(&self, current_time: u64) -> Result<bool> {
        match self.start_date > current_time {
            true => Ok(true),
            false => {
                let time_elapsed = current_time
                    .checked_sub(self.last_payment_timestamp)
                    .unwrap();

                Ok(time_elapsed < self.payout_interval)
            }
        }
    }

    pub fn is_expired(&self, current_time: u64) -> Result<bool> {
        Ok(self
            .start_date
            .checked_add(self.total_vesting_duration)
            .unwrap()
            <= current_time)
    }

    pub fn get_amount_per_payout(&self) -> Result<u64> {
        Ok(self
            .initial_deposit_amount
            .checked_div(self.total_number_of_payouts)
            .unwrap())
    }
}
