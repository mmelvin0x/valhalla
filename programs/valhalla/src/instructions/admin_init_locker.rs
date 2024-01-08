use anchor_lang::prelude::*;

use crate::{ constants, state::Locker };

#[derive(Accounts)]
pub struct InitLocker<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(
        init,
        seeds = [constants::LOCKER_SEED],
        bump,
        payer = admin,
        space = 8 + std::mem::size_of::<Locker>()
    )]
    pub locker: Account<'info, Locker>,

    /// CHECK: Only read from and stored as a Pubkey on the Locker
    pub treasury: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
}

pub fn init_locker_ix(ctx: Context<InitLocker>, fee: u64) -> Result<()> {
    let locker = &mut ctx.accounts.locker;

    // Setup the Locker
    locker.fee = fee;
    locker.admin = ctx.accounts.admin.key();
    locker.treasury = ctx.accounts.treasury.key();

    Ok(())
}
