use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{ self, Mint, Token, TokenAccount, TransferChecked },
};

use crate::{ constants, state::Lock };

#[derive(Accounts)]
pub struct DepositToLock<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,

    #[account(
        seeds = [creator.key().as_ref(), mint.key().as_ref(), constants::LOCK_SEED],
        bump,
        has_one = mint,
        has_one = creator
    )]
    pub lock: Account<'info, Lock>,

    #[account(
        mut,
        seeds = [
            lock.key().as_ref(),
            creator.key().as_ref(),
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
        associated_token::authority = creator
    )]
    pub creator_token_account: Account<'info, TokenAccount>,

    pub mint: Account<'info, Mint>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

pub fn deposit_to_lock_ix(ctx: Context<DepositToLock>, deposit_amount: u64) -> Result<()> {
    let lock_token_account = &ctx.accounts.lock_token_account;
    let creator_token_account = &ctx.accounts.creator_token_account;

    // Prevent creator from depositing more than they have
    let amount = deposit_amount
        .checked_mul((10u64).pow(ctx.accounts.mint.decimals as u32))
        .unwrap()
        .min(creator_token_account.amount);

    // Transfer tokens from creator to lock
    let cpi_accounts = TransferChecked {
        from: creator_token_account.to_account_info(),
        mint: ctx.accounts.mint.to_account_info(),
        to: lock_token_account.to_account_info(),
        authority: ctx.accounts.creator.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);

    token::transfer_checked(cpi_ctx, amount, ctx.accounts.mint.decimals)?;

    Ok(())
}
