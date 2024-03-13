use anchor_lang::prelude::*;

use crate::{constants, errors::ValhallaError, state::Config};

/// Accounts required for updating the configuration.
#[derive(Accounts)]
pub struct UpdateConfig<'info> {
    /// The admin account that is authorized to update the configuration.
    #[account(mut, constraint = config.admin == admin.key())]
    pub admin: Signer<'info>,

    /// The new admin account to be set in the configuration.
    pub new_admin: SystemAccount<'info>,

    /// The new treasury account to be set in the configuration.
    pub new_treasury: SystemAccount<'info>,

    /// The configuration account to be updated.
    #[account(
        mut,
        seeds = [constants::CONFIG_SEED],
        bump,
        has_one = admin,
        has_one = treasury
    )]
    pub config: Account<'info, Config>,

    /// The treasury account associated with the configuration.
    #[account(constraint = config.treasury == treasury.key())]
    pub treasury: SystemAccount<'info>,
}

impl<'info> UpdateConfig<'info> {
    /// Updates the configuration with the new admin account and treasury account.
    ///
    /// # Arguments
    ///
    /// * `new_fee` - The new fee to be set in the configuration.
    ///
    /// # Errors
    ///
    /// Returns an error if the caller is not authorized to update the configuration.
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
