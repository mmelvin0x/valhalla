use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{ self, Mint, Token, TokenAccount, Transfer },
};

use crate::{ constants, state::Lock };

#[derive(Accounts)]
#[instruction(deposit_amount: u64)]
pub struct DepositToLock<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        seeds = [user.key().as_ref(), mint.key().as_ref(), constants::LOCK_SEED],
        bump,
        has_one = mint,
        has_one = user
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
        mut,
        associated_token::mint = mint,
        associated_token::authority = user
    )]
    pub user_token_account: Account<'info, TokenAccount>,

    pub mint: Account<'info, Mint>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

pub fn deposit_to_lock(ctx: Context<DepositToLock>, deposit_amount: u64) -> Result<()> {
    let lock_token_account = &ctx.accounts.lock_token_account;
    let user_token_account = &ctx.accounts.user_token_account;

    // Prevent user from depositing more than they have
    let calc_amount = deposit_amount
        .checked_mul((10u64).pow(ctx.accounts.mint.decimals as u32))
        .unwrap();

    let amount = calc_amount.min(user_token_account.amount);

    // Transfer tokens from user to lock
    let cpi_accounts = Transfer {
        from: user_token_account.to_account_info(),
        to: lock_token_account.to_account_info(),
        authority: ctx.accounts.user.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);

    token::transfer(cpi_ctx, amount)?;

    Ok(())
}
