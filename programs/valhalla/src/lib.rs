use anchor_lang::prelude::*;

mod id;
mod constants;
mod errors;
mod instructions;
mod state;
mod events;

pub use instructions::*;
pub use state::*;

pub use id::ID;

#[program]
/// The `valhalla` module contains functions for interacting with the Valhalla program.
pub mod valhalla {
    use super::*;

    /// Initializes the Valhalla program with the given context and fee.
    ///
    /// # Arguments
    ///
    /// * `ctx` - The context for the initialization.
    /// * `fee` - The fee to be charged for the initialization.
    ///
    /// # Errors
    ///
    /// Returns an error if the initialization fails.
    pub fn admin_initialize(ctx: Context<AdminInitialize>, fee: u64) -> Result<()> {
        instructions::admin_initialize_ix(ctx, fee)
    }

    /// Updates the fee for the Valhalla program with the given context and new fee.
    ///
    /// # Arguments
    ///
    /// * `ctx` - The context for the update.
    /// * `new_fee` - The new fee to be set.
    ///
    /// # Errors
    ///
    /// Returns an error if the update fails.
    pub fn admin_update(ctx: Context<AdminUpdate>, new_fee: u64) -> Result<()> {
        instructions::admin_update_ix(ctx, new_fee)
    }

    /// Creates a lock with the given parameters.
    ///
    /// # Arguments
    ///
    /// * `ctx` - The context for the lock creation.
    /// * `amount_to_be_vested` - The amount to be vested.
    /// * `vesting_duration` - The duration of the vesting period.
    /// * `payout_interval` - The interval at which payouts will be made.
    /// * `cliff_payment_amount` - The amount to be paid at the cliff.
    /// * `cancel_authority` - The authority to cancel the lock.
    /// * `change_recipient_authority` - The authority to change the recipient of the lock.
    /// * `name` - The name of the lock.
    ///
    /// # Errors
    ///
    /// Returns an error if the lock creation fails.
    pub fn create_lock(
        ctx: Context<Create>,
        amount_to_be_vested: u64,
        vesting_duration: u64,
        payout_interval: u64,
        cliff_payment_amount: u64,
        start_date: u64,
        cancel_authority: Authority,
        change_recipient_authority: Authority,
        name: String
    ) -> Result<()> {
        instructions::create_ix(
            ctx,
            amount_to_be_vested,
            vesting_duration,
            payout_interval,
            cliff_payment_amount,
            start_date,
            cancel_authority,
            change_recipient_authority,
            name
        )
    }

    /// Disburses the vested amount for a lock.
    ///
    /// # Arguments
    ///
    /// * `ctx` - The context for the disbursement.
    ///
    /// # Errors
    ///
    /// Returns an error if the disbursement fails.
    pub fn disburse(ctx: Context<Disburse>) -> Result<()> {
        instructions::disburse_ix(ctx)
    }

    /// Closes a lock.
    ///
    /// # Arguments
    ///
    /// * `ctx` - The context for the lock closure.
    ///
    /// # Errors
    ///
    /// Returns an error if the lock closure fails.
    pub fn cancel(ctx: Context<Cancel>) -> Result<()> {
        instructions::cancel_ix(ctx)
    }

    /// Updates the recipient of a lock.
    ///
    /// # Arguments
    ///
    /// * `ctx` - The context for the update.
    ///
    /// # Errors
    ///
    /// Returns an error if the update fails.
    pub fn update(ctx: Context<Update>) -> Result<()> {
        instructions::update_ix(ctx)
    }
}
