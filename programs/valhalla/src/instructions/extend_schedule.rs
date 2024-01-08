use std::vec;

use anchor_lang::prelude::*;
use anchor_spl::{
    token::{ self, Mint, Token, TokenAccount, TransferChecked },
    associated_token::AssociatedToken,
};

use crate::{ constants, state::Lock, Schedule };

#[derive(Accounts)]
#[instruction(new_schedules: Vec<Schedule>)]
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
        realloc = 8 + std::mem::size_of::<Lock>() + std::mem::size_of::<Schedule>() * new_schedules.len(),
        realloc::payer = creator,
        realloc::zero = true,
    )]
    pub lock: Account<'info, Lock>,

    pub mint: Account<'info, Mint>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

pub fn extend_schedule_ix(
    ctx: Context<ExtendSchedule>,
    schedules: Vec<Schedule>,
    amount: u64
) -> Result<()> {
    let lock = &mut ctx.accounts.lock;
    let schedules_formatted = Lock::format_schedules(schedules.clone(), ctx.accounts.mint.decimals);

    if amount > 0 {
        let amount =
            ctx.accounts.lock_token_account.amount +
            amount
                .checked_mul((10u64).pow(ctx.accounts.mint.decimals as u32))
                .unwrap()
                .min(ctx.accounts.creator_token_account.amount);

        lock.validate_schedule_deposit_amount(amount)?;
        lock.validate_schedule_unlock_dates(schedules_formatted.clone())?;

        // Transfer tokens from creator to lock
        let cpi_accounts = TransferChecked {
            from: ctx.accounts.creator_token_account.to_account_info(),
            mint: ctx.accounts.mint.to_account_info(),
            to: ctx.accounts.lock_token_account.to_account_info(),
            authority: ctx.accounts.creator.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);

        token::transfer_checked(cpi_ctx, amount, ctx.accounts.mint.decimals)?;
    }

    Ok(())
}
