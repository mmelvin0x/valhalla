use anchor_lang::prelude::*;

use crate::{ constants, state::Locker, events::AdminEvent };

#[derive(Accounts)]
/// Represents the initialization parameters for the admin account.
pub struct AdminInitialize<'info> {
    /// The admin account that will sign the transaction.
    #[account(mut)]
    pub admin: Signer<'info>,

    /// The locker account that will be initialized.
    #[account(
        init,
        seeds = [constants::LOCKER_SEED],
        bump,
        payer = admin,
        space = Locker::size_of()
    )]
    pub locker: Account<'info, Locker>,

    /// The treasury account that receives the fee.
    /// CHECK: This account is only read from and stored as a Pubkey on the Locker.
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
    let locker = &mut ctx.accounts.locker;

    locker.fee = fee;
    locker.admin = ctx.accounts.admin.key();
    locker.treasury = ctx.accounts.treasury.key();

    emit!(AdminEvent {
        admin: ctx.accounts.admin.key(),
        treasury: ctx.accounts.treasury.key(),
        fee,
    });

    Ok(())
}
