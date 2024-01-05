use anchor_lang::prelude::*;
use anchor_spl::{ token::{ Mint, Token, TokenAccount }, associated_token::AssociatedToken };

use crate::{ constants, state::Lock, errors::LockError };

#[derive(Accounts)]
#[instruction(duration: u64)]
pub struct ExtendLock<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        mut,
        seeds = [
            lock.key().as_ref(),
            user.key().as_ref(),
            mint.key().as_ref(),
            constants::LOCK_TOKEN_ACCOUNT_SEED,
        ],
        bump,
        token::mint = mint,
        token::authority = lock_token_account,
    )]
    pub lock_token_account: Account<'info, TokenAccount>,

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

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

pub fn extend_lock(ctx: Context<ExtendLock>, new_unlock_date: u64) -> Result<()> {
    let lock = &mut ctx.accounts.lock;

    // Ensure the new unlock date is greater than the current unlock date.
    if new_unlock_date <= lock.unlock_date {
        return Err(LockError::InvalidUnlockDate.into());
    }

    lock.unlock_date = new_unlock_date;

    Ok(())
}
