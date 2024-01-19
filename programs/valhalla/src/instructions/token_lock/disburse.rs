use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_2022::{self as token, TransferChecked},
    token_interface::{Mint, Token2022, TokenAccount},
};

use crate::{constants, errors::ValhallaError, state::TokenLock};

#[derive(Accounts)]
pub struct DisburseTokenLock<'info> {
    #[account(mut)]
    pub funder: Signer<'info>,

    #[account(
        init_if_needed,
        payer = funder,
        associated_token::mint = mint,
        associated_token::authority = funder,
        associated_token::token_program = token_program
    )]
    /// The funder's token account.
    pub funder_token_account: InterfaceAccount<'info, TokenAccount>,

    #[account(
        mut,
        seeds = [
            funder.key().as_ref(),
            mint.key().as_ref(),
            constants::TOKEN_LOCK_SEED
        ],
        bump,
        has_one = mint,
        has_one = funder,
    )]
    pub token_lock: Account<'info, TokenLock>,

    #[account(
        mut,
        seeds = [token_lock.key().as_ref(), constants::TOKEN_LOCK_TOKEN_ACCOUNT_SEED],
        bump,
        token::mint = mint,
        token::authority = token_lock_token_account,
    )]
    pub token_lock_token_account: InterfaceAccount<'info, TokenAccount>,

    pub mint: InterfaceAccount<'info, Mint>,

    pub token_program: Program<'info, Token2022>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

pub fn disburse_token_lock_ix(ctx: Context<DisburseTokenLock>) -> Result<()> {
    let token_lock = &mut ctx.accounts.token_lock;

    let current_time = Clock::get()?.unix_timestamp as u64;
    let is_locked = current_time
        .checked_sub(token_lock.created_timestamp)
        .unwrap_or_default()
        < token_lock.total_vesting_duration;

    if !is_locked {
        let lock_key = token_lock.key();
        let bump = ctx.bumps.token_lock_token_account;
        let signer_seeds: &[&[&[u8]]] = &[&[
            lock_key.as_ref(),
            constants::TOKEN_LOCK_TOKEN_ACCOUNT_SEED,
            &[bump],
        ]];
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_accounts = TransferChecked {
            from: ctx.accounts.token_lock_token_account.to_account_info(),
            mint: ctx.accounts.mint.to_account_info(),
            to: ctx.accounts.funder_token_account.to_account_info(),
            authority: ctx.accounts.token_lock_token_account.to_account_info(),
        };
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer_seeds);

        token::transfer_checked(
            cpi_ctx,
            ctx.accounts.token_lock_token_account.amount,
            ctx.accounts.mint.decimals,
        )?;
    } else {
        return Err(ValhallaError::Locked.into());
    }

    Ok(())
}
