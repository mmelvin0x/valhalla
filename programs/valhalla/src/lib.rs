use anchor_lang::prelude::*;

mod constants;
mod errors;
mod id;
mod instructions;
mod state;
mod types;

pub use instructions::*;
pub use state::*;
pub use types::*;

pub use id::ID;

#[program]
/// The `valhalla` module contains functions for creating, updating, and managing vaults.
pub mod valhalla {
    use super::*;

    /// Creates a new configuration with the specified fee.
    ///
    /// # Arguments
    ///
    /// * `ctx` - The context for the transaction.
    /// * `fee` - The fee to be set for the configuration.
    ///
    /// # Errors
    ///
    /// Returns an error if the configuration creation fails.
    pub fn create_config(ctx: Context<CreateConfig>, fee: u64) -> Result<()> {
        ctx.accounts.create(fee)
    }

    /// Updates the configuration with a new fee.
    ///
    /// # Arguments
    ///
    /// * `ctx` - The context for the transaction.
    /// * `new_fee` - The new fee to be set for the configuration.
    ///
    /// # Errors
    ///
    /// Returns an error if the configuration update fails.
    pub fn update_config(ctx: Context<UpdateConfig>, new_fee: u64) -> Result<()> {
        ctx.accounts.update(new_fee)
    }

    /// Creates a new vault with the specified parameters.
    ///
    /// # Arguments
    ///
    /// * `ctx` - The context for the transaction.
    /// * `identifier` - The identifier for the vault.
    /// * `name` - The name of the vault.
    /// * `amount_to_be_vested` - The amount to be vested in the vault.
    /// * `total_vesting_duration` - The total duration of the vesting period.
    /// * `cancel_authority` - The authority to cancel the vault, optional, defaults to Neither.
    /// * `change_recipient_authority` - The authority to change the recipient of the vesting amount, optional, defaults to Neither.
    /// * `payout_interval` - The interval at which the vesting amount is paid out, optional, defaults to `total_vesting_duration`.
    /// * `start_date` - The start date of the vesting period, optional, defaults to `0`.
    ///
    /// # Errors
    ///
    /// Returns an error if the vault creation fails.
    pub fn create(
        ctx: Context<CreateVault>,
        identifier: u64,
        name: [u8; 32],
        amount_to_be_vested: u64,
        total_vesting_duration: u64,
        cancel_authority: Option<Authority>,
        change_recipient_authority: Option<Authority>,
        payout_interval: Option<u64>,
        start_date: Option<u64>,
    ) -> Result<()> {
        ctx.accounts.create(
            identifier,
            name,
            amount_to_be_vested,
            total_vesting_duration,
            ctx.bumps.vault_ata,
            cancel_authority,
            change_recipient_authority,
            payout_interval,
            start_date,
        )
    }

    /// Disburses the vested amount from the vault.
    ///
    /// # Arguments
    ///
    /// * `ctx` - The context for the transaction.
    ///
    /// # Errors
    ///
    /// Returns an error if the disbursement fails.
    pub fn disburse(ctx: Context<DisburseVault>) -> Result<()> {
        ctx.accounts.disburse()
    }

    /// Closes the vault, preventing further vesting and disbursements.
    ///
    /// # Arguments
    ///
    /// * `ctx` - The context for the transaction.
    ///
    /// # Errors
    ///
    /// Returns an error if the vault closure fails.
    pub fn close(ctx: Context<CloseVault>) -> Result<()> {
        ctx.accounts.close()
    }

    /// Updates the vault with any changes to the parameters.
    ///
    /// # Arguments
    ///
    /// * `ctx` - The context for the transaction.
    ///
    /// # Errors
    ///
    /// Returns an error if the vault update fails.
    pub fn update(ctx: Context<UpdateVault>) -> Result<()> {
        ctx.accounts.update()
    }

    /// Cancels the vault, preventing further vesting and disbursements and returning the remaining funds to the cancel authority.
    ///
    /// # Arguments
    ///
    /// * `ctx` - The context for the transaction.
    ///
    /// # Errors
    ///
    /// Returns an error if the vault cancellation fails.
    pub fn cancel(ctx: Context<CancelVault>) -> Result<()> {
        ctx.accounts.cancel()
    }
}
