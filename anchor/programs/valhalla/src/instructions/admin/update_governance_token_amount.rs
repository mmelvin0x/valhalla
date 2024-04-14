use anchor_lang::prelude::*;

use crate::{constants, Config, ValhallaError};

#[derive(Accounts)]
pub struct UpdateGovernanceTokenAmount<'info> {
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

impl<'info> UpdateGovernanceTokenAmount<'info> {
    pub fn update(&mut self, governance_token_amount: u64) -> Result<()> {
        // Ensure that the caller is authorized to update the configuration.
        require!(
            self.config.admin == self.admin.key(),
            ValhallaError::Unauthorized
        );

        self.config.governance_token_amount = governance_token_amount;

        Ok(())
    }
}
