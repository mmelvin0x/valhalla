use anchor_lang::prelude::*;

use crate::{constants, Config, ValhallaError};

#[derive(Accounts)]
pub struct UpdateAdmin<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    pub new_admin: SystemAccount<'info>,

    #[account(
        mut,
        seeds = [constants::CONFIG_SEED],
        bump,
        has_one = admin,
    )]
    pub config: Box<Account<'info, Config>>,
}

impl<'info> UpdateAdmin<'info> {
    pub fn update(&mut self) -> Result<()> {
        // Ensure that the caller is authorized to update the configuration.
        require!(
            self.config.admin == self.admin.key(),
            ValhallaError::Unauthorized
        );

        self.config.admin = self.new_admin.key();

        Ok(())
    }
}
