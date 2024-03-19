use anchor_lang::prelude::*;

use crate::{constants, errors::ValhallaError, state::Config};

#[derive(Accounts)]
pub struct UpdateDaoTreasury<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(
        mut,
        seeds = [constants::CONFIG_SEED],
        bump,
        has_one = admin,
    )]
    pub config: Box<Account<'info, Config>>,

    pub new_dao_treasury: SystemAccount<'info>,
}

impl<'info> UpdateDaoTreasury<'info> {
    pub fn update(&mut self) -> Result<()> {
        // Ensure that the caller is authorized to update the configuration.
        require!(
            self.config.admin == self.admin.key(),
            ValhallaError::Unauthorized
        );

        self.config.dao_treasury = self.new_dao_treasury.key();

        Ok(())
    }
}
