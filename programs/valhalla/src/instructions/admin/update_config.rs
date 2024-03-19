use anchor_lang::prelude::*;

use crate::{constants, errors::ValhallaError, state::Config};

#[derive(Accounts)]
pub struct UpdateConfig<'info> {
    #[account(mut, constraint = config.admin == admin.key())]
    pub admin: Signer<'info>,

    pub new_admin: SystemAccount<'info>,

    pub new_dao_treasury: SystemAccount<'info>,

    #[account(
        mut,
        seeds = [constants::CONFIG_SEED],
        bump,
        has_one = admin,
    )]
    pub config: Box<Account<'info, Config>>,
}

impl<'info> UpdateConfig<'info> {
    pub fn update(
        &mut self,
        new_dev_fee: u64,
        new_token_fee_basis_points: u64,
        new_governance_token_amount: u64,
    ) -> Result<()> {
        // Ensure that the caller is authorized to update the configuration.
        require!(
            self.config.admin == self.admin.key(),
            ValhallaError::Unauthorized
        );

        // Require that the new fee is greater than or equal to the minimum fee.
        require!(
            new_dev_fee >= constants::MIN_SOL_FEE,
            ValhallaError::InvalidSolFee
        );
        self.config.dev_fee = new_dev_fee;

        // Require that the new token fee basis points are less than or equal to 500.
        require!(
            new_token_fee_basis_points <= 500,
            ValhallaError::InvalidTokenFeeBasisPoints
        );
        self.config.token_fee_basis_points = new_token_fee_basis_points;

        // Update the configuration with the new dao treasury account if it is different.
        if self.new_dao_treasury.key() != self.config.dao_treasury.key() {
            self.config.dao_treasury = self.new_dao_treasury.key();
        }

        // Update the configuration with the new reward token amount.
        if self.config.governance_token_amount != new_governance_token_amount {
            self.config.governance_token_amount = new_governance_token_amount;
        }

        // Update the configuration with the new admin account if it is different.
        if self.new_admin.key() != self.admin.key() {
            self.config.admin = self.new_admin.key();
        }

        Ok(())
    }
}
