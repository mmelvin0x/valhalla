use anchor_lang::prelude::*;

use crate::errors::LockError;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, PartialEq)]
pub enum Authority {
    Neither,
    Funder,
    Beneficiary,
    Both,
}

#[account]
pub struct Lock {
    pub funder: Pubkey,
    pub beneficiary: Pubkey,
    pub mint: Pubkey,
    pub cancel_authority: Authority,
    pub change_recipient_authority: Authority,
    pub vesting_duration: u64,
    pub payout_interval: u64,
    pub amount_per_payout: u64,
    pub start_date: u64,
    pub cliff_payment_amount: u64,
    pub num_payments_made: u64,
}

impl Lock {
    pub fn size_of() -> usize {
        8 + 32 + 32 + 32 + 1 + 1 + 8 + 8 + 8 + 8 + 8 + 8
    }
    /// Checks if the lock contract can disburse tokens.
    ///
    /// # Returns
    ///
    /// Returns `true` if the lock contract can disburse tokens, otherwise `false`.
    ///
    /// # Errors
    ///
    /// Returns an error if the operation fails.
    pub fn can_disburse(&self) -> Result<bool> {
        if self.start_date < (Clock::get()?.unix_timestamp as u64) {
            let time_locked = self.start_date + self.payout_interval * (self.num_payments_made + 1);
            let current_time = Clock::get()?.unix_timestamp as u64;

            Ok(time_locked <= current_time)
        } else {
            Ok(false)
        }
    }

    /// Validates the deposit amount for the lock contract.
    ///
    /// # Arguments
    ///
    /// * `vesting_duration` - The length of the lock in seconds.
    /// * `payout_interval` - The interval (in seconds) at which tokens are paid out.
    /// * `amount_to_be_vested` - The amount of tokens to be vested.
    /// * `cliff_payment_amount` - The amount of tokens issued to the beneficiary on creation of the contract.
    /// * `balance` - The balance of the account.
    /// * `decimals` - The number of decimal places for the tokens.
    ///
    /// # Errors
    ///
    /// Returns an error if the deposit amount is invalid.
    ///
    /// # Returns
    ///
    /// Returns a tuple containing the total amount of tokens to be locked and the amount of tokens issued per payout.
    pub fn validate_deposit_amount(
        vesting_duration: u64,
        payout_interval: u64,
        amount_to_be_vested: u64,
        cliff_payment_amount: u64,
        balance: u64,
        decimals: u32
    ) -> Result<(u64, u64)> {
        // Get the amount of tokens that are being locked
        let amount = amount_to_be_vested.checked_mul((10u64).pow(decimals)).unwrap();

        // We need to check with the cliff amount added if it is non-zero
        if cliff_payment_amount > 0 {
            let cliff_payment_amount = cliff_payment_amount
                .checked_mul((10u64).pow(decimals))
                .unwrap();

            if amount + cliff_payment_amount > balance {
                return Err(LockError::InsufficientFundsForDeposit.into());
            }
        }

        // Ensure that there are enough tokens being deposited to cover all of the payouts
        let total_payouts = vesting_duration.checked_div(payout_interval).unwrap();
        let amount_per_payout = amount.checked_div(total_payouts).unwrap();
        let total_payout_amount = amount_per_payout.checked_mul(total_payouts).unwrap();
        if total_payout_amount > amount {
            return Err(LockError::InsufficientFundsForTotalPayouts.into());
        }

        Ok((amount, amount_per_payout))
    }
}
