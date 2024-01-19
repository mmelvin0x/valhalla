use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_2022::{self as token, CloseAccount, TransferChecked},
    token_interface::{Mint, Token2022, TokenAccount},
};

use crate::{constants, errors::ValhallaError, state::ScheduledPayment, Authority};

#[derive(Accounts)]
pub struct CancelScheduledPayment<'info> {
    #[account(mut, constraint = funder.key() == signer.key() || recipient.key() == signer.key())]
    pub signer: Signer<'info>,

    #[account(mut, constraint = scheduled_payment.funder == funder.key())]
    /// CHECK: Checked in contstraints
    pub funder: AccountInfo<'info>,

    #[account(mut, constraint = scheduled_payment.recipient == recipient.key())]
    /// CHECK: Checked in constraints
    pub recipient: AccountInfo<'info>,

    #[account(
        mut,
        close = funder,
        seeds = [
            funder.key().as_ref(),
            recipient.key().as_ref(),
            mint.key().as_ref(),
            constants::SCHEDULED_PAYMENT_SEED,
        ],
        bump,
        has_one = recipient,
        has_one = funder,
        has_one = mint,
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

    #[account(
        init_if_needed,
        payer = signer,
        associated_token::mint = mint,
        associated_token::authority = funder
    )]
    pub funder_token_account: InterfaceAccount<'info, TokenAccount>,

    pub mint: InterfaceAccount<'info, Mint>,

    pub token_program: Program<'info, Token2022>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

pub fn cancel_scheduled_payment_ix(ctx: Context<CancelScheduledPayment>) -> Result<()> {
    let scheduled_payment = &mut ctx.accounts.scheduled_payment;

    // Check the cancel authority
    match scheduled_payment.cancel_authority {
        Authority::Neither => {
            return Err(ValhallaError::Unauthorized.into());
        }
        Authority::Funder => {
            if ctx.accounts.funder.key() != ctx.accounts.signer.key() {
                return Err(ValhallaError::Unauthorized.into());
            }
        }
        Authority::Recipient => {
            if ctx.accounts.recipient.key() != ctx.accounts.signer.key() {
                return Err(ValhallaError::Unauthorized.into());
            }
        }
        Authority::Both => {
            if ctx.accounts.funder.key() != ctx.accounts.signer.key()
                || ctx.accounts.recipient.key() != ctx.accounts.signer.key()
            {
                return Err(ValhallaError::Unauthorized.into());
            }
        }
    }

    let lock_key = ctx.accounts.scheduled_payment.to_account_info().key();
    let bump = ctx.bumps.payment_token_account;
    let signer: &[&[&[u8]]] = &[&[
        lock_key.as_ref(),
        constants::SCHEDULED_PAYMENT_TOKEN_ACCOUNT_SEED,
        &[bump],
    ]];

    // If the scheduled_payment token account has a balance, transfer it to the funder
    if ctx.accounts.payment_token_account.amount > 0 {
        let payment_token_account = &ctx.accounts.payment_token_account;
        let funder_token_account = &ctx.accounts.funder_token_account;

        let cpi_accounts = TransferChecked {
            from: payment_token_account.to_account_info(),
            mint: ctx.accounts.mint.to_account_info(),
            to: funder_token_account.to_account_info(),
            authority: ctx.accounts.payment_token_account.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);

        token::transfer_checked(
            cpi_ctx,
            ctx.accounts.payment_token_account.amount,
            ctx.accounts.mint.decimals,
        )?;
    }

    // Close the scheduled_payment token account
    let cpi_accounts = CloseAccount {
        account: ctx.accounts.payment_token_account.to_account_info(),
        destination: ctx.accounts.funder.to_account_info(),
        authority: ctx.accounts.payment_token_account.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);

    token::close_account(cpi_ctx)?;

    Ok(())
}
