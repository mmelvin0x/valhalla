use anchor_lang::prelude::*;

use crate::{constants, state::Config};

#[derive(Accounts)]
/// Represents the initialization parameters for the admin account.
pub struct AdminInitialize<'info> {
    /// The admin account that will sign the transaction.
    #[account(mut)]
    pub admin: Signer<'info>,

    /// The config account that will be initialized.
    #[account(
        init,
        seeds = [constants::CONFIG_SEED],
        bump,
        payer = admin,
        space = Config::size_of()
    )]
    pub config: Account<'info, Config>,

    /// The treasury account that receives the fee.
    /// CHECK: This account is only read from and stored as a Pubkey on the Config.
    pub treasury: AccountInfo<'info>,

    /// The system program account.
    pub system_program: Program<'info, System>,
}

/// Initializes the Valhalla program with the given context and fee.
///
/// # Arguments
///
/// * `ctx` - The context for the initialization.
/// * `fee` - The fee to be charged for the initialization.
///
/// # Errors
///
/// Returns an error if the initialization fails.
pub fn admin_initialize_ix(ctx: Context<AdminInitialize>, fee: u64) -> Result<()> {
    let config = &mut ctx.accounts.config;

    config.fee = fee;
    config.admin = ctx.accounts.admin.key();
    config.treasury = ctx.accounts.treasury.key();

    Ok(())
}
