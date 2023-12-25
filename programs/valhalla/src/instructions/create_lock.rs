use anchor_lang::prelude::*;
use anchor_spl::{ associated_token::AssociatedToken, token::{ self, Mint, Token, TokenAccount } };

use crate::{ constants, state::Lock };

#[derive(Accounts)]
#[instruction(unlock_date: u64, amount: u64)]
pub struct CreateLock<'info> {
    #[account(mut)]
    /// The user paying for the tx
    pub user: Signer<'info>,

    #[account(
        init,
        payer = user,
        seeds = [user.key().as_ref(), mint.key().as_ref(), constants::LOCK_SEED],
        space = Lock::LEN,
        bump
    )]
    pub lock: Account<'info, Lock>,

    #[account(
        init_if_needed,
        seeds = [
            lock.key().as_ref(),
            user.key().as_ref(),
            mint.key().as_ref(),
            constants::LOCK_TOKEN_ACCOUNT_SEED,
        ],
        bump,
        payer = user,
        token::mint = mint,
        token::authority = lock_token_account
    )]
    pub lock_token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = user,
    )]
    pub user_token_account: Account<'info, TokenAccount>,

    pub mint: Account<'info, Mint>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

pub fn create_lock(ctx: Context<CreateLock>, unlock_date: u64, deposit_amount: u64) -> Result<()> {
    let now = Clock::get()?.unix_timestamp as u64;
    let lock = &mut ctx.accounts.lock;

    // Set lock state
    lock.user = ctx.accounts.user.key();
    lock.mint = ctx.accounts.mint.key();
    lock.locked_date = now;
    lock.unlock_date = unlock_date;

    // Prevent user from depositing more than they have
    let amount = if ctx.accounts.user_token_account.amount < deposit_amount {
        ctx.accounts.user_token_account.amount
    } else {
        deposit_amount
    };

    // Transfer the user's tokens to the lock token account
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_accounts = token::TransferChecked {
        from: ctx.accounts.user_token_account.to_account_info(),
        to: ctx.accounts.lock_token_account.to_account_info(),
        authority: ctx.accounts.user.to_account_info(),
        mint: ctx.accounts.mint.to_account_info(),
    };
    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);

    token::transfer_checked(cpi_ctx, amount, ctx.accounts.mint.decimals)?;

    Ok(())
}
