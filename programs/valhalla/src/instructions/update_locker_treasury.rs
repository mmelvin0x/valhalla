use anchor_lang::prelude::*;

use crate::{ constants, state::Locker, errors::LockError };

#[derive(Accounts)]
pub struct UpdateLockerTreasury<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(mut, seeds = [constants::LOCKER_SEED], bump, has_one = admin, has_one = treasury)]
    pub locker: Account<'info, Locker>,

    #[account(mut, constraint = locker.treasury == treasury.key())]
    /// CHECK: Only read from and stored as a Pubkey on the Locker
    pub treasury: AccountInfo<'info>,
}

pub fn update_locker_treasury(
    ctx: Context<UpdateLockerTreasury>,
    new_treasury: Pubkey
) -> Result<()> {
    let locker = &mut ctx.accounts.locker;

    if locker.admin != *ctx.accounts.admin.key {
        return Err(LockError::Unauthorized.into());
    }

    locker.treasury = new_treasury;

    Ok(())
}
