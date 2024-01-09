use anchor_lang::prelude::*;

use crate::{ constants, state::Locker, errors::LockError };

#[derive(Accounts)]
/// Represents an update operation for the admin, treasury, and discount token mint of a Locker account.
pub struct Update<'info> {
    #[account(mut, constraint = locker.admin == admin.key())]
    /// The current admin account.
    pub admin: Signer<'info>,

    /// The new admin account.
    /// CHECK: Used in constraints and stored on the Locker account
    pub new_admin: AccountInfo<'info>,

    /// The new treasury account.
    /// CHECK: Used in constraints and stored on the Locker account
    pub new_treasury: AccountInfo<'info>,

    #[account(
        mut,
        seeds = [constants::LOCKER_SEED],
        bump,
        has_one = admin,
        has_one = treasury
    )]
    /// The Locker account to be updated.
    pub locker: Account<'info, Locker>,

    #[account(constraint = locker.treasury == treasury.key())]
    /// CHECK: Only receives the fee
    /// The current treasury account that receives the fee.
    pub treasury: AccountInfo<'info>,
}

pub fn admin_update_ix(ctx: Context<Update>, new_fee: u64) -> Result<()> {
    let locker = &mut ctx.accounts.locker;

    if locker.admin != ctx.accounts.admin.key() {
        return Err(LockError::Unauthorized.into());
    }

    locker.admin = ctx.accounts.new_admin.key();
    locker.treasury = ctx.accounts.new_treasury.key();
    locker.fee = new_fee;

    Ok(())
}
