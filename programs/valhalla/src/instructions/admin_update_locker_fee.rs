use anchor_lang::prelude::*;

use crate::{ constants, state::Locker, errors::LockError };

#[derive(Accounts)]
pub struct UpdateLockerFee<'info> {
    #[account(mut, constraint = locker.admin == admin.key())]
    pub admin: Signer<'info>,

    #[account(mut, seeds = [constants::LOCKER_SEED], bump, has_one = admin, has_one = treasury)]
    pub locker: Account<'info, Locker>,

    #[account(mut, constraint = locker.treasury == treasury.key())]
    /// CHECK: Only read from and stored as a Pubkey on the Locker
    pub treasury: AccountInfo<'info>,
}

pub fn update_locker_fee_ix(ctx: Context<UpdateLockerFee>, new_fee: u64) -> Result<()> {
    let locker = &mut ctx.accounts.locker;

    if locker.admin != *ctx.accounts.admin.key {
        return Err(LockError::Unauthorized.into());
    }

    locker.fee = new_fee;

    Ok(())
}
