use anchor_lang::prelude::*;

use crate::types::Authority;

#[account]
/// Represents a vault.
pub struct Vault {
    /// The identifier of the vault, a randomly generated number.
    pub identifier: u64,

    /// The name of the vault, string of length 32.
    pub name: [u8; 32],

    /// The public key of the creator of the vault.
    pub creator: Pubkey,

    /// The public key of the recipient of the vault.
    pub recipient: Pubkey,

    /// The public key of the mint associated with the vault.
    pub mint: Pubkey,

    /// The total duration of vesting for the vault.
    pub total_vesting_duration: u64,

    /// The timestamp when the vault was created.
    pub created_timestamp: u64,

    /// The start date of the vault.
    pub start_date: u64,

    /// The timestamp of the last payment made from the vault.
    pub last_payment_timestamp: u64,

    /// Initial deposit amount.
    pub initial_deposit_amount: u64,

    /// The number of payments to be made by the vault.
    pub total_number_of_payouts: u64,

    /// The payout interval.
    pub payout_interval: u64,

    /// The number of payments made from the vault.
    pub number_of_payments_made: u64,

    /// The authority to cancel the vault.
    pub cancel_authority: Authority,

    /// The bump value for the vault associated token account pda associated with the vault.
    pub token_account_bump: u8,
}

/// Implementation of the `Space` trait for the `Vault` struct.
impl Space for Vault {
    /// The initial space required for a `Vault` instance.
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
            1; // token_account_bump
}

impl<'info> Vault {
    /// Checks if the vault is locked.
    ///
    /// # Arguments
    ///
    /// * `current_time` - The current time.
    ///
    /// # Returns
    ///
    /// This method returns `Ok(true)` if the vault is locked, `Ok(false)` otherwise.
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

    /// Checks if the vault has reached it's total vesting duration.
    ///
    /// # Arguments
    ///
    /// * `current_time` - The current time.
    ///
    /// # Returns
    ///
    /// This method returns `Ok(true)` if the vault has reached it's total vesting duration, `Ok(false)` otherwise.
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
