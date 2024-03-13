use anchor_lang::prelude::*;

use crate::{constants, errors::ValhallaError, state::Config};

/// Accounts required to create a configuration.
#[derive(Accounts)]
pub struct CreateConfig<'info> {
    #[account(mut)]
    /// The admin account that will sign the transaction.
    pub admin: Signer<'info>,

    #[account(
        init,
        seeds = [constants::CONFIG_SEED],
        bump,
        payer = admin,
        space = Config::INIT_SPACE
    )]
    /// The configuration account to be created.
    pub config: Account<'info, Config>,

    /// The treasury account.
    pub treasury: SystemAccount<'info>,

    /// The system program account.
    pub system_program: Program<'info, System>,
}

impl<'info> CreateConfig<'info> {
    /// Creates a new configuration.
    ///
    /// # Arguments
    ///
    /// * `fee` - The fee value for the configuration.
    ///
    /// # Errors
    ///
    /// Returns an error if the configuration account is already initialized.
    pub fn create(&mut self, fee: u64) -> Result<()> {
        let config = &mut self.config;

        // If the config account is already initialized, return an error.
        if config.admin.key() != Pubkey::default() {
            return Err(ValhallaError::AlreadyCreateConfig.into());
        }

        config.set_inner(Config {
            admin: self.admin.key(),
            treasury: self.treasury.key(),
            fee,
        });

        Ok(())
    }
}
