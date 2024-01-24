use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_2022::{self as token, CloseAccount, TransferChecked},
    token_interface::{Mint, Token2022, TokenAccount},
};

use crate::{constants, errors::ValhallaError, state::VestingSchedule, Authority};

#[derive(Accounts)]
pub struct CancelVestingSchedule<'info> {
    #[account(mut, constraint = creator.key() == signer.key() || recipient.key() == signer.key())]
    pub signer: Signer<'info>,

    #[account(mut, constraint = vesting_schedule.creator == creator.key())]
    /// CHECK: Checked in contstraints
    pub creator: AccountInfo<'info>,

    #[account(mut, constraint = vesting_schedule.recipient == recipient.key())]
    /// CHECK: Checked in constraints
    pub recipient: AccountInfo<'info>,

    #[account(
        mut,
        close = creator,
        seeds = [
            creator.key().as_ref(),
            recipient.key().as_ref(),
            mint.key().as_ref(),
            constants::VESTING_SCHEDULE_SEED,
        ],
        bump,
        has_one = recipient,
        has_one = creator,
        has_one = mint,
    )]
    pub vesting_schedule: Account<'info, VestingSchedule>,

    #[account(
        mut,
        seeds = [vesting_schedule.key().as_ref(), constants::VESTING_SCHEDULE_TOKEN_ACCOUNT_SEED],
        bump,
        token::mint = mint,
        token::authority = vesting_schedule_token_account,
    )]
    pub vesting_schedule_token_account: InterfaceAccount<'info, TokenAccount>,

    #[account(
        init_if_needed,
        payer = signer,
        associated_token::mint = mint,
        associated_token::authority = creator
    )]
    pub creator_token_account: InterfaceAccount<'info, TokenAccount>,

    pub mint: InterfaceAccount<'info, Mint>,

    pub token_program: Program<'info, Token2022>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

pub fn cancel_vesting_schedule_ix(ctx: Context<CancelVestingSchedule>) -> Result<()> {
    let vesting_schedule = &mut ctx.accounts.vesting_schedule;

    // Check the cancel authority
    match vesting_schedule.cancel_authority {
        Authority::Neither => {
            return Err(ValhallaError::Unauthorized.into());
        }
        Authority::Creator => {
            if ctx.accounts.creator.key() != ctx.accounts.signer.key() {
                return Err(ValhallaError::Unauthorized.into());
            }
        }
        Authority::Recipient => {
            if ctx.accounts.recipient.key() != ctx.accounts.signer.key() {
                return Err(ValhallaError::Unauthorized.into());
            }
        }
        Authority::Both => {
            if ctx.accounts.creator.key() != ctx.accounts.signer.key()
                || ctx.accounts.recipient.key() != ctx.accounts.signer.key()
            {
                return Err(ValhallaError::Unauthorized.into());
            }
        }
    }

    let lock_key = ctx.accounts.vesting_schedule.to_account_info().key();
    let bump = ctx.bumps.vesting_schedule_token_account;
    let signer: &[&[&[u8]]] = &[&[
        lock_key.as_ref(),
        constants::VESTING_SCHEDULE_TOKEN_ACCOUNT_SEED,
        &[bump],
    ]];

    // If the vesting_schedule token account has a balance, transfer it to the creator
    if ctx.accounts.vesting_schedule_token_account.amount > 0 {
        let vesting_schedule_token_account = &ctx.accounts.vesting_schedule_token_account;
        let creator_token_account = &ctx.accounts.creator_token_account;

        let cpi_accounts = TransferChecked {
            from: vesting_schedule_token_account.to_account_info(),
            mint: ctx.accounts.mint.to_account_info(),
            to: creator_token_account.to_account_info(),
            authority: ctx
                .accounts
                .vesting_schedule_token_account
                .to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);

        token::transfer_checked(
            cpi_ctx,
            ctx.accounts.vesting_schedule_token_account.amount,
            ctx.accounts.mint.decimals,
        )?;
    }

    // Close the vesting_schedule token account
    let cpi_accounts = CloseAccount {
        account: ctx
            .accounts
            .vesting_schedule_token_account
            .to_account_info(),
        destination: ctx.accounts.creator.to_account_info(),
        authority: ctx
            .accounts
            .vesting_schedule_token_account
            .to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);

    token::close_account(cpi_ctx)?;

    Ok(())
}
