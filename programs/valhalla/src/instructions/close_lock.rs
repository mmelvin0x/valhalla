use anchor_lang::prelude::*;
use anchor_spl::{ associated_token::AssociatedToken, token::{ Mint, Token, TokenAccount } };

use crate::{ constants, errors::LockError, state::Lock };

#[derive(Accounts)]
pub struct CloseLock<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        mut,
        close = user,
        seeds = [
            user.key().as_ref(),
            mint.key().as_ref(),
            constants::LOCK_SEED,
        ],
        bump,
    )]
    pub lock: Account<'info, Lock>,

    #[account(
        mut,
        close = user,
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

    pub mint: Account<'info, Mint>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

pub fn close_lock(ctx: Context<CloseLock>) -> Result<()> {
    let lock = &mut ctx.accounts.lock;

    // Ensure that the lock is unlocked
    if lock.unlock_date > (Clock::get()?.unix_timestamp as u64) {
        return Err(LockError::Locked.into());
    }

    Ok(())
}
