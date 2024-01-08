use std::vec;

use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{ TokenAccount, Mint, Token },
    token_2022::{ TransferChecked, self },
};

use crate::{ constants, state::Lock };

#[derive(Accounts)]
pub struct ExtendSchedule<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,

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

    #[account(
        mut,
        seeds = [
            creator.key().as_ref(),
            mint.key().as_ref(),
            constants::LOCK_SEED,
        ],
        bump,
        has_one = mint,
        has_one = creator,
    )]
    pub lock: Account<'info, Lock>,

    pub mint: Account<'info, Mint>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

pub fn increase_num_payouts_ix(
    ctx: Context<ExtendSchedule>,
    total_payments_increase_amount: u64
) -> Result<()> {
    let lock = &mut ctx.accounts.lock;
    let amount_per_payout = lock.amount_per_payout;

    // Increase total payments
    lock.total_payments += total_payments_increase_amount;

    // Get the amount needed to transfer to cover the increase in total payments
    let amount = total_payments_increase_amount.checked_mul(amount_per_payout).unwrap();

    // Transfer tokens from creator to lock
    let cpi_accounts = TransferChecked {
        from: ctx.accounts.creator_token_account.to_account_info(),
        mint: ctx.accounts.mint.to_account_info(),
        to: ctx.accounts.lock_token_account.to_account_info(),
        authority: ctx.accounts.creator.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);

    token_2022::transfer_checked(cpi_ctx, amount, ctx.accounts.mint.decimals)?;

    Ok(())
}
