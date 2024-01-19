use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_2022::{self as token, TransferChecked},
    token_interface::{Mint, Token2022, TokenAccount},
};

use crate::{constants, errors::ValhallaError, state::ScheduledPayment};

#[derive(Accounts)]
pub struct DisburseScheduledPayment<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    /// CHECK: Used in constraints
    pub funder: AccountInfo<'info>,

    /// CHECK: Used in constraints
    pub recipient: AccountInfo<'info>,

    #[account(
        init_if_needed,
        payer = signer,
        associated_token::mint = mint,
        associated_token::authority = recipient
    )]
    pub recipient_token_account: InterfaceAccount<'info, TokenAccount>,

    #[account(
        mut,
        seeds = [
            funder.key().as_ref(),
            mint.key().as_ref(),
            constants::SCHEDULED_PAYMENT_SEED
        ],
        bump,
        has_one = mint,
        has_one = funder,
    )]
    pub scheduled_payment: Account<'info, ScheduledPayment>,

    #[account(
        mut,
        seeds = [scheduled_payment.key().as_ref(), constants::SCHEDULED_PAYMENT_TOKEN_ACCOUNT_SEED],
        bump,
        token::mint = mint,
        token::authority = payment_token_account,
    )]
    pub payment_token_account: InterfaceAccount<'info, TokenAccount>,

    pub mint: InterfaceAccount<'info, Mint>,

    pub token_program: Program<'info, Token2022>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

pub fn disburse_scheduled_payment_ix(ctx: Context<DisburseScheduledPayment>) -> Result<()> {
    let scheduled_payment = &mut ctx.accounts.scheduled_payment;

    let current_time = Clock::get()?.unix_timestamp as u64;
    let is_locked = current_time
        .checked_sub(scheduled_payment.created_timestamp)
        .unwrap_or_default()
        < scheduled_payment.total_vesting_duration;

    if !is_locked {
        let lock_key = scheduled_payment.key();
        let bump = ctx.bumps.payment_token_account;
        let signer_seeds: &[&[&[u8]]] = &[&[
            lock_key.as_ref(),
            constants::SCHEDULED_PAYMENT_TOKEN_ACCOUNT_SEED,
            &[bump],
        ]];
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_accounts = TransferChecked {
            from: ctx.accounts.payment_token_account.to_account_info(),
            mint: ctx.accounts.mint.to_account_info(),
            to: ctx.accounts.recipient_token_account.to_account_info(),
            authority: ctx.accounts.payment_token_account.to_account_info(),
        };
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer_seeds);

        token::transfer_checked(
            cpi_ctx,
            ctx.accounts.payment_token_account.amount,
            ctx.accounts.mint.decimals,
        )?;
    } else {
        return Err(ValhallaError::Locked.into());
    }

    Ok(())
}
