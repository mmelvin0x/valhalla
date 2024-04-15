use anchor_lang::prelude::*;

use crate::{constants, Config, ValhallaError};

#[derive(Accounts)]
pub struct UpdateTokenFeeBasisPoints<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(
        mut,
        seeds = [constants::CONFIG_SEED],
        bump,
        has_one = admin,
    )]
    pub config: Box<Account<'info, Config>>,
}

impl<'info> UpdateTokenFeeBasisPoints<'info> {
    pub fn update(&mut self, token_fee_basis_points: u64) -> Result<()> {
        // Ensure that the caller is authorized to update the configuration.
        require!(
            self.config.admin == self.admin.key(),
            ValhallaError::Unauthorized
        );

        require!(
            token_fee_basis_points <= constants::MAX_BASIS_POINTS,
            ValhallaError::InvalidTokenFeeBasisPoints
        );

        self.config.token_fee_basis_points = token_fee_basis_points;

        Ok(())
    }
}
