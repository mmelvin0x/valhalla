use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_2022::{ self as token, TransferChecked },
    token_interface::{ Token2022, TokenAccount, Mint },
};

use crate::{ constants, errors::LockError, state::Lock };

#[derive(Accounts)]
pub struct Disburse<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    /// CHECK: Used for seeds
    pub funder: AccountInfo<'info>,

    /// CHECK: Used in constraints
    pub recipient: AccountInfo<'info>,

    #[account(
        mut,
        seeds = [funder.key().as_ref(), mint.key().as_ref(), constants::LOCK_SEED],
        bump,
        has_one = mint,
        has_one = funder,
        has_one = recipient
    )]
    pub lock: Account<'info, Lock>,

    #[account(
        mut,
        seeds = [
            lock.key().as_ref(),
            funder.key().as_ref(),
            mint.key().as_ref(),
            constants::LOCK_TOKEN_ACCOUNT_SEED,
        ],
        bump,
        token::mint = mint,
        token::authority = lock_token_account,
    )]
    pub lock_token_account: InterfaceAccount<'info, TokenAccount>,

    #[account(
        init_if_needed,
        payer = signer,
        associated_token::mint = mint,
        associated_token::authority = recipient
    )]
    pub recipient_token_account: InterfaceAccount<'info, TokenAccount>,

    pub mint: InterfaceAccount<'info, Mint>,

    pub token_program: Program<'info, Token2022>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

pub fn disburse_ix(ctx: Context<Disburse>) -> Result<()> {
    let mut transfer_amount: u64 = 0;
    let lock = &mut ctx.accounts.lock;

    let current_time = Clock::get()?.unix_timestamp as u64;
    let time_since_last_payout = current_time.checked_sub(lock.last_payment_timestamp).unwrap();

    if lock.start_date < current_time {
        if lock.cliff_payment_amount > 0 && !lock.is_cliff_payment_disbursed {
            transfer_amount = transfer_amount.checked_add(lock.cliff_payment_amount).unwrap();
            lock.is_cliff_payment_disbursed = true;
        }

        if time_since_last_payout >= lock.payout_interval {
            transfer_amount = transfer_amount.checked_add(lock.amount_per_payout).unwrap();
            lock.last_payment_timestamp = current_time;
        }
    } else {
        return Err(LockError::Locked.into());
    }

    if transfer_amount > 0 {
        // If this is a transfer fee token, the last payment will be less than the amount per payout,
        // so we need to check if the lock token account has enough to cover the transfer amount
        // and if not, set the transfer amount to the lock token account's balance
        if transfer_amount > ctx.accounts.lock_token_account.amount {
            transfer_amount = ctx.accounts.lock_token_account.amount;
        }

        let lock_key = lock.key();
        let funder_key = ctx.accounts.funder.key();
        let mint_key = ctx.accounts.mint.key();
        let bump = ctx.bumps.lock_token_account;
        let signer_seeds: &[&[&[u8]]] = &[
            &[
                lock_key.as_ref(),
                funder_key.as_ref(),
                mint_key.as_ref(),
                constants::LOCK_TOKEN_ACCOUNT_SEED,
                &[bump],
            ],
        ];
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_accounts = TransferChecked {
            from: ctx.accounts.lock_token_account.to_account_info(),
            mint: ctx.accounts.mint.to_account_info(),
            to: ctx.accounts.recipient_token_account.to_account_info(),
            authority: ctx.accounts.lock_token_account.to_account_info(),
        };
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer_seeds);

        token::transfer_checked(cpi_ctx, transfer_amount, ctx.accounts.mint.decimals)?;
    } else {
        return Err(LockError::NoPayout.into());
    }

    Ok(())
}
