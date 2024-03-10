use anchor_lang::prelude::*;

use crate::{constants, errors::ValhallaError, state::Config};

#[derive(Accounts)]
pub struct AdminInitialize<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(
        init,
        seeds = [constants::CONFIG_SEED],
        bump,
        payer = admin,
        space = Config::INIT_SPACE
    )]
    pub config: Account<'info, Config>,

    pub treasury: SystemAccount<'info>,

    pub system_program: Program<'info, System>,
}

impl<'info> AdminInitialize<'info> {
    pub fn initialize(&mut self, fee: u64) -> Result<()> {
        let config = &mut self.config;

        // If the config account is already initialized, return an error.
        if config.admin.key() != Pubkey::default() {
            return Err(ValhallaError::AlreadyInitialized.into());
        }

        config.set_inner(Config {
            admin: self.admin.key(),
            treasury: self.treasury.key(),
            fee,
        });

        Ok(())
    }
}
