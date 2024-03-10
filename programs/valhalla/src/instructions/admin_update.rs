use anchor_lang::prelude::*;

use crate::{constants, errors::ValhallaError, state::Config};

#[derive(Accounts)]
pub struct AdminUpdate<'info> {
    #[account(mut, constraint = config.admin == admin.key())]
    pub admin: Signer<'info>,

    pub new_admin: SystemAccount<'info>,

    pub new_treasury: SystemAccount<'info>,

    #[account(
        mut,
        seeds = [constants::CONFIG_SEED],
        bump,
        has_one = admin,
        has_one = treasury
    )]
    pub config: Account<'info, Config>,

    #[account(constraint = config.treasury == treasury.key())]
    pub treasury: SystemAccount<'info>,
}

impl<'info> AdminUpdate<'info> {
    pub fn update(&mut self, new_fee: u64) -> Result<()> {
        let config = &mut self.config;

        if config.admin != self.admin.key() {
            return Err(ValhallaError::Unauthorized.into());
        }

        config.set_inner(Config {
            admin: self.new_admin.key(),
            treasury: self.new_treasury.key(),
            fee: new_fee,
        });

        Ok(())
    }
}
