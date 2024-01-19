use anchor_lang::prelude::*;

use crate::{constants, errors::ValhallaError, state::Config};

#[derive(Accounts)]
/// Represents an update operation for the admin, treasury, and discount token mint of a Config account.
pub struct AdminUpdate<'info> {
    #[account(mut, constraint = config.admin == admin.key())]
    /// The current admin account.
    pub admin: Signer<'info>,

    /// The new admin account.
    /// CHECK: Used in constraints and stored on the Config account
    pub new_admin: AccountInfo<'info>,

    /// The new treasury account.
    /// CHECK: Used in constraints and stored on the Config account
    pub new_treasury: AccountInfo<'info>,

    #[account(
        mut,
        seeds = [constants::CONFIG_SEED],
        bump,
        has_one = admin,
        has_one = treasury
    )]
    /// The Config account to be updated.
    pub config: Account<'info, Config>,

    #[account(constraint = config.treasury == treasury.key())]
    /// CHECK: Only receives the fee
    /// The current treasury account that receives the fee.
    pub treasury: AccountInfo<'info>,
}

pub fn admin_update_ix(ctx: Context<AdminUpdate>, new_fee: u64) -> Result<()> {
    let config = &mut ctx.accounts.config;

    if config.admin != ctx.accounts.admin.key() {
        return Err(ValhallaError::Unauthorized.into());
    }

    config.admin = ctx.accounts.new_admin.key();
    config.treasury = ctx.accounts.new_treasury.key();
    config.fee = new_fee;

    Ok(())
}
