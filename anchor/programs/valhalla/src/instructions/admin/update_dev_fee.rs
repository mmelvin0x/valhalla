use anchor_lang::prelude::*;

use crate::{constants, errors::ValhallaError, state::Config};

#[derive(Accounts)]
pub struct UpdateDevFee<'info> {
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

impl<'info> UpdateDevFee<'info> {
    pub fn update(&mut self, dev_fee: u64) -> Result<()> {
        // Ensure that the caller is authorized to update the configuration.
        require!(
            self.config.admin == self.admin.key(),
            ValhallaError::Unauthorized
        );

        require!(
            dev_fee >= constants::MIN_SOL_FEE,
            ValhallaError::InvalidSolFee
        );

        self.config.dev_fee = dev_fee;

        Ok(())
    }
}
