use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{ Mint, Token, TokenAccount, Transfer, self, CloseAccount },
};

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
        init_if_needed,
        payer = user,
        associated_token::mint = mint,
        associated_token::authority = user
    )]
    pub user_token_account: Account<'info, TokenAccount>,

    pub mint: Account<'info, Mint>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

pub fn close_lock(ctx: Context<CloseLock>) -> Result<()> {
    let lock = &ctx.accounts.lock;

    // Ensure that the lock is unlocked
    if !lock.is_unlocked() {
        return Err(LockError::Locked.into());
    }

    // If the lock token account has a balance, transfer it to the user
    if ctx.accounts.lock_token_account.amount > 0 {
        let lock_key = ctx.accounts.lock.to_account_info().key();
        let user_key = ctx.accounts.user.to_account_info().key();
        let mint_key = ctx.accounts.mint.to_account_info().key();

        let lock_token_account = &ctx.accounts.lock_token_account;
        let user_token_account = &ctx.accounts.user_token_account;

        let bump = ctx.bumps.lock_token_account;
        let signer: &[&[&[u8]]] = &[
            &[
                lock_key.as_ref(),
                user_key.as_ref(),
                mint_key.as_ref(),
                constants::LOCK_TOKEN_ACCOUNT_SEED,
                &[bump],
            ],
        ];

        // Transfer tokens from lock to user
        let cpi_accounts = Transfer {
            from: lock_token_account.to_account_info(),
            to: user_token_account.to_account_info(),
            authority: ctx.accounts.lock_token_account.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);

        token::transfer(cpi_ctx, ctx.accounts.lock_token_account.amount)?;

        // Close the lock token account
        let cpi_accounts = CloseAccount {
            account: ctx.accounts.lock_token_account.to_account_info(),
            destination: ctx.accounts.user.to_account_info(),
            authority: ctx.accounts.lock_token_account.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);

        token::close_account(cpi_ctx)?;
    }

    Ok(())
}
