use anchor_lang::prelude::*;

use crate::{constants, errors::ValhallaError, state::Config};

/// Accounts required for updating the configuration.
#[derive(Accounts)]
pub struct UpdateConfig<'info> {
    /// The admin account that is authorized to update the configuration.
    #[account(mut, constraint = config.admin == admin.key())]
    pub admin: Signer<'info>,

    /// The new admin account to be set in the configuration.
    /// Pass in the same admin if you don't want to change it.
    pub new_admin: SystemAccount<'info>,

    /// The new token treasury account to be set in the configuration.
    /// Pass in the same token treasury if you don't want to change it.
    pub new_token_treasury: SystemAccount<'info>,

    /// The configuration account to be updated.
    #[account(
        mut,
        seeds = [constants::CONFIG_SEED],
        bump,
        has_one = admin,
    )]
    pub config: Box<Account<'info, Config>>,
}

impl<'info> UpdateConfig<'info> {
    /// Updates the configuration with the new admin account and treasury account.
    ///
    /// # Arguments
    ///
    /// * `new_sol_fee` - The new fee to be set in the configuration.
    /// * `new_token_fee_basis_points` - The new basis points of the token fee to be set in the configuration.
    /// * `new_reward_token_amount` - The new amount of reward tokens to be minted.
    ///
    /// # Errors
    ///
    /// Returns an error if the caller is not authorized to update the configuration.
    pub fn update(
        &mut self,
        new_sol_fee: u64,
        new_token_fee_basis_points: u64,
        new_reward_token_amount: u64,
    ) -> Result<()> {
        // Ensure that the caller is authorized to update the configuration.
        require!(
            self.config.admin == self.admin.key(),
            ValhallaError::Unauthorized
        );

        // Require that the new fee is greater than or equal to the minimum fee.
        require!(
            new_sol_fee >= constants::MIN_SOL_FEE,
            ValhallaError::InvalidSolFee
        );
        self.config.sol_fee = new_sol_fee;

        // Require that the new token fee basis points are less than or equal to 500.
        require!(
            new_token_fee_basis_points <= 500,
            ValhallaError::InvalidTokenFeeBasisPoints
        );
        self.config.token_fee_basis_points = new_token_fee_basis_points;

        // Update the configuration with the new token treasury account if it is different.
        if self.new_token_treasury.key() != self.config.token_treasury.key() {
            self.config.token_treasury = self.new_token_treasury.key();
        }

        // Update the configuration with the new reward token amount.
        if self.config.reward_token_amount != new_reward_token_amount {
            self.config.reward_token_amount = new_reward_token_amount;
        }

        // Update the configuration with the new admin account if it is different.
        if self.new_admin.key() != self.admin.key() {
            self.config.admin = self.new_admin.key();
        }

        Ok(())
    }
}
