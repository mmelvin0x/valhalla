use anchor_lang::prelude::*;
use anchor_spl::token::Mint;

use crate::{ constants, state::Lock };

#[derive(Accounts)]
#[instruction(duration: u64)]
pub struct ExtendLock<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        mut,
        seeds = [
            user.key().as_ref(),
            mint.key().as_ref(),
            constants::LOCK_SEED,
        ],
        bump,
        has_one = mint,
        has_one = user,
    )]
    pub lock: Account<'info, Lock>,

    pub mint: Account<'info, Mint>,

    pub system_program: Program<'info, System>,
}

pub fn extend_lock(ctx: Context<ExtendLock>, duration: u64) -> Result<()> {
    let lock = &mut ctx.accounts.lock;

    lock.unlock_date += duration;

    Ok(())
}
