use anchor_lang::prelude::*;

use crate::{ constants, state::Locker };

#[derive(Accounts)]
pub struct Init<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(init, payer = admin, seeds = [constants::LOCKER_SEED], space = Locker::LEN, bump)]
    pub locker: Account<'info, Locker>,

    /// CHECK: Only read from and stored as a Pubkey on the Locker
    pub treasury: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
}

pub fn init(ctx: Context<Init>, fee: u64) -> Result<()> {
    let locker = &mut ctx.accounts.locker;

    locker.admin = *ctx.accounts.admin.key;
    locker.treasury = *ctx.accounts.treasury.key;
    locker.fee = fee;

    Ok(())
}
