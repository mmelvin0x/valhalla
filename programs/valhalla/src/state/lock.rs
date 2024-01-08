use anchor_lang::prelude::*;

#[account]
pub struct Lock {
    pub creator: Pubkey,
    pub beneficiary: Pubkey,
    pub mint: Pubkey,
    pub lock_token_account: Pubkey,
    pub creator_token_account: Pubkey,
    pub beneficiary_token_account: Pubkey,
    pub locked_date: u64,
    pub total_payments: u64,
    pub amount_per_payout: u64,
    pub payout_interval: u64,
    pub num_payments_made: u64,
}

impl Lock {
    pub fn can_disburse(&self) -> Result<bool> {
        let time_locked = self.locked_date + self.payout_interval * (self.num_payments_made + 1);
        let current_time = Clock::get()?.unix_timestamp as u64;

        Ok(time_locked <= current_time)
    }
}