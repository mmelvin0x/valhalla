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

// TODO: Add taking a % of deposit as fee
// TODO: Add reward token distribution for disbursing funds

#[program]
/// The `valhalla` module contains functions for creating, updating, and managing vaults.
pub mod valhalla {
    use super::*;

    /// Creates a new configuration with the specified fee.
    ///
    /// # Arguments
    ///
    /// * `ctx` - The context for the transaction.
    /// * `name` - The name of the token.
    /// * `symbol` - The symbol of the token.
    /// * `uri` - The URI of the token.
    /// * `decimals` - The number of decimals for the token.
    /// * `dev_fee` - The fee value for the configuration.
    /// * `token_fee_basis_points` - The basis points of the token fee.
    /// * `governance_token_amount` - The amount of reward tokens to be minted.
    /// * `dev_treasury_governance_token_amount` - The amount of reward tokens to be minted for the dev treasury.
    /// * `dao_treasury_governance_token_amount` - The amount of reward tokens to be minted for the dao treasury.
    ///
    /// # Errors
    ///
    /// Returns an error if the configuration creation fails.
    pub fn create_config(
        ctx: Context<CreateConfig>,
        name: String,
        symbol: String,
        uri: String,
        decimals: u8,
        dev_fee: u64,
        token_fee_basis_points: u64,
        governance_token_amount: u64,
    ) -> Result<()> {
        ctx.accounts.create(
            name,
            symbol,
            uri,
            decimals,
            dev_fee,
            token_fee_basis_points,
            governance_token_amount,
            &ctx.bumps,
        )
    }

    /// Updates the admin of the program.
    ///
    /// # Arguments
    ///
    /// * `ctx` - The context for the transaction.
    ///
    /// # Errors
    ///
    /// Returns an error if the admin update fails.
    pub fn update_admin(ctx: Context<UpdateAdmin>) -> Result<()> {
        ctx.accounts.update()
    }

    /// Updates the dao treasury.
    ///
    /// # Arguments
    ///
    /// * `ctx` - The context for the transaction.
    ///
    /// # Errors
    ///
    /// Returns an error if the dao treasury update fails.
    pub fn update_dao_treasury(ctx: Context<UpdateDaoTreasury>) -> Result<()> {
        ctx.accounts.update()
    }

    /// Updates the fee for the development team.
    ///
    /// # Arguments
    ///
    /// * `ctx` - The context for the transaction.
    /// * `dev_fee` - The fee value for the configuration.
    ///
    /// # Errors
    ///
    /// Returns an error if the dev fee update fails.
    pub fn update_dev_fee(ctx: Context<UpdateDevFee>, dev_fee: u64) -> Result<()> {
        ctx.accounts.update(dev_fee)
    }

    /// Updates the amount of governance tokens to be minted.
    ///
    /// # Arguments
    ///
    /// * `ctx` - The context for the transaction.
    /// * `governance_token_amount` - The amount of governance tokens to be minted.
    ///
    /// # Errors
    ///
    /// Returns an error if the governance token amount update fails.
    pub fn update_governance_token_amount(
        ctx: Context<UpdateGovernanceTokenAmount>,
        governance_token_amount: u64,
    ) -> Result<()> {
        ctx.accounts.update(governance_token_amount)
    }

    /// Updates the basis points of the token fee.
    ///
    /// # Arguments
    ///
    /// * `ctx` - The context for the transaction.
    /// * `token_fee_basis_points` - The basis points of the token fee.
    ///
    /// # Errors
    ///
    /// Returns an error if the token fee basis points update fails.
    pub fn update_token_fee_basis_points(
        ctx: Context<UpdateTokenFeeBasisPoints>,
        token_fee_basis_points: u64,
    ) -> Result<()> {
        ctx.accounts.update(token_fee_basis_points)
    }

    /// Mints governance tokens to the receiver.
    ///
    /// # Arguments
    ///
    /// * `ctx` - The context for the transaction.
    /// * `amount` - The amount of governance tokens to mint.
    ///
    /// # Errors
    ///
    /// Returns an error if the minting fails.
    pub fn mint_governance_tokens(ctx: Context<MintGovernanceTokens>, amount: u64) -> Result<()> {
        ctx.accounts.mint_governance_tokens(amount, &ctx.bumps)
    }

    /// Creates a new vault with the specified parameters.
    ///
    /// # Arguments
    ///
    /// * `ctx` - The context for the transaction.
    /// * `identifier` - The identifier of the vault.
    /// * `name` - The name of the vault.
    /// * `amount_to_be_vested` - The amount to be vested in the vault.
    /// * `total_vesting_duration` - The total duration of the vesting period.
    /// * `start_date` - The start date of the vesting period.
    /// * `payout_interval` - The interval at which the vested amount is disbursed.
    /// * `cancel_authority` - The authority to cancel the vault.
    /// * `autopay` - Whether the vault should automatically disburse the vested amount.
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
        start_date: u64,
        payout_interval: u64,
        cancel_authority: Authority,
        autopay: Autopay,
    ) -> Result<()> {
        ctx.accounts.create(
            identifier,
            name,
            amount_to_be_vested,
            total_vesting_duration,
            start_date,
            payout_interval,
            cancel_authority,
            autopay,
            &ctx.bumps,
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
        ctx.accounts.disburse(&ctx.bumps)
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
