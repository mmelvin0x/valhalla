use anchor_lang::prelude::*;

mod id;
mod constants;
mod errors;
mod instructions;
mod state;

pub use instructions::*;
pub use state::*;

pub use id::ID;

#[program]
pub mod valhalla {
    use super::*;

    /// # Initializes a new locker.
    ///
    /// ## Accounts expected
    ///
    /// 0. `[signer]` The payer account for the locker account.
    /// 1. `[writable]` The locker account to be initialized.
    /// 2. `[]` The treasury account.
    /// 3. `[executable]` The system program.
    ///
    /// ## Arguments
    ///
    /// * `fee` - The fee to be charged for each lock.
    pub fn init(
        ctx: Context<Init>,
        fee: u64,
        treasury_allocation: u64,
        uri: String,
        name: String,
        symbol: String
    ) -> Result<()> {
        instructions::init(ctx, fee, treasury_allocation, uri, name, symbol)
    }

    /// # Updates the fee of a locker.
    ///
    /// ## Accounts expected
    ///
    /// 0. `[signer]` The payer account for the locker account.
    /// 1. `[writable]` The locker account.
    /// 2. `[]` The treasury account.
    ///
    /// ## Arguments
    ///
    /// * `new_fee` - The new fee of the locker.
    ///
    /// ## Errors
    ///
    /// * `Unauthorized` - The signer is not the current admin.
    pub fn update_locker_fee(ctx: Context<UpdateLockerFee>, fee: u64) -> Result<()> {
        instructions::update_locker_fee(ctx, fee)
    }

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
    /// * `new_unlock_date` - The new unlock date.
    ///
    /// ## Errors
    ///
    /// * `InvalidUnlockDate` - The new unlock date is invalid. Must be greater than the current unlock date.
    pub fn extend_lock(ctx: Context<ExtendLock>, new_unlock_date: u64) -> Result<()> {
        instructions::extend_lock(ctx, new_unlock_date)
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
