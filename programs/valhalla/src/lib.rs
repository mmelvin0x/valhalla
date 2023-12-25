use anchor_lang::prelude::*;

mod constants;
mod errors;
mod instructions;
mod state;

pub use instructions::*;

declare_id!("GQKWvZqbZrwCsLpsRu1Jov8iKNwvHE4af7aEw7khwhun");

#[program]
pub mod valhalla {
    use super::*;

    /// # Creates a new lock.
    ///
    /// ## Accounts expected
    ///
    /// 0. `[signer]` The payer account for the lock account.
    /// 1. `[]` The public key of the treasury.
    /// 2. `[writable]` The locker account.
    /// 3. `[writable]` The lock account to be initialized.
    /// 4. `[writable]` The lock token account to be initialized.
    /// 5. `[writable]` The owner token account.
    /// 6. `[]` The mint account.
    /// 7. `[executable]` The token program.
    /// 8. `[executable]` The associated token program.
    /// 9. `[executable]` The system program.
    ///
    /// ## Arguments
    ///
    /// * `unlock_date` - The unlock date of the lock.
    /// * `deposit_amount` - The amount of tokens to be deposited into the lock.
    ///
    /// ## Errors
    ///
    /// `InvalidUnlockDate` - The unlock date is invalid. Must be in the future.
    pub fn create_lock(
        ctx: Context<CreateLock>,
        unlock_date: u64,
        deposit_amount: u64
    ) -> Result<()> {
        instructions::create_lock(ctx, unlock_date, deposit_amount)
    }

    /// # Deposits tokens into a lock.
    ///
    /// ## Accounts expected
    ///
    /// 0. `[signer]` The payer account for the lock account.
    /// 1. `[writable]` The lock account.
    /// 2. `[writable]` The lock token account.
    /// 3. `[writable]` The owner token account.
    /// 4. `[]` The mint account.
    /// 5. `[executable]` The token program.
    /// 6. `[executable]` The associated token program.
    /// 7. `[executable]` The system program.
    ///
    /// ## Arguments
    ///
    /// * `deposit_amount` - The amount of tokens to be deposited into the lock.
    pub fn deposit_to_lock(ctx: Context<DepositToLock>, deposit_amount: u64) -> Result<()> {
        instructions::deposit_to_lock(ctx, deposit_amount)
    }

    /// # Extends the unlock date of a lock.
    ///
    /// ## Accounts expected
    ///
    /// 0. `[signer]` The payer account for the lock account.
    /// 1. `[writable]` The lock account.
    /// 2. `[]` The mint account.
    /// 3. `[executable]` The system program.
    ///
    /// ## Arguments
    ///
    /// * `duration` - The duration to extend the lock by.
    pub fn extend_lock(ctx: Context<ExtendLock>, duration: u64) -> Result<()> {
        instructions::extend_lock(ctx, duration)
    }

    /// # Withdraws tokens from a lock.
    ///
    /// ## Accounts expected
    ///
    /// 0. `[signer]` The payer account for the lock account.
    /// 1. `[writable]` The locker account.
    /// 2. `[writable]` The lock account.
    /// 3. `[writable]` The lock token account.
    /// 4. `[writable]` The owner token account.
    /// 5. `[]` The mint account.
    /// 6. `[executable]` The token program.
    /// 7. `[executable]` The associated token program.
    /// 8. `[executable]` The system program.
    ///
    /// ## Arguments
    ///
    /// * `withdraw_amount` - The amount of tokens to be withdrawn from the lock.
    ///
    /// ## Errors
    ///
    /// * `Locked` - The lock is still locked.
    pub fn withdraw_from_lock(ctx: Context<WithdrawFromLock>, withdraw_amount: u64) -> Result<()> {
        instructions::withdraw_from_lock(ctx, withdraw_amount)
    }

    /// # Closes a lock.
    ///
    /// ## Accounts expected
    ///
    /// 0. `[signer]` The payer account for the lock account.
    /// 1. `[writable]` The locker account.
    /// 2. `[writable]` The lock account.
    /// 3. `[writable]` The lock token account.
    /// 4. `[]` The mint account.
    /// 5. `[executable]` The token program.
    /// 6. `[executable]` The associated token program.
    /// 7. `[executable]` The system program.
    ///
    /// ## Arguments
    ///
    /// * none
    ///
    /// ## Errors
    ///
    /// * `Locked` - The lock is still locked.
    pub fn close_lock(ctx: Context<CloseLock>) -> Result<()> {
        instructions::close_lock(ctx)
    }
}
