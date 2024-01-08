use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{ Mint, Token, TokenAccount },
    token_2022::{ self, TransferChecked },
};

use crate::{ constants, errors::LockError, state::Lock };

#[derive(Accounts)]
pub struct DisburseToBeneficiary<'info> {
    #[account(mut)]
    pub any_user: Signer<'info>,

    /// CHECK: Used for seeds
    pub creator: AccountInfo<'info>,

    /// CHECK: Used in constraints
    pub beneficiary: AccountInfo<'info>,

    #[account(
        seeds = [creator.key().as_ref(), mint.key().as_ref(), constants::LOCK_SEED],
        bump,
        has_one = mint,
        has_one = creator,
        has_one = beneficiary
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
        init_if_needed,
        payer = any_user,
        associated_token::mint = mint,
        associated_token::authority = beneficiary
    )]
    pub beneficiary_token_account: Account<'info, TokenAccount>,

    pub mint: Account<'info, Mint>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

pub fn disburse_to_beneficiary_ix(ctx: Context<DisburseToBeneficiary>) -> Result<()> {
    let lock = &mut ctx.accounts.lock;

    let lock_token_account = &ctx.accounts.lock_token_account;
    let beneficiary_token_account = &ctx.accounts.beneficiary_token_account;

    // Ensure that the lock is unlocked
    if !lock.can_disburse()? {
        return Err(LockError::Locked.into());
    }

    let lock_key = lock.key();
    let creator_key = ctx.accounts.creator.key();
    let mint_key = ctx.accounts.mint.key();

    let bump = ctx.bumps.lock_token_account;
    let signer: &[&[&[u8]]] = &[
        &[
            lock_key.as_ref(),
            creator_key.as_ref(),
            mint_key.as_ref(),
            constants::LOCK_TOKEN_ACCOUNT_SEED,
            &[bump],
        ],
    ];

    // Transfer tokens from lock to beneficiary
    let cpi_accounts = TransferChecked {
        from: lock_token_account.to_account_info(),
        mint: ctx.accounts.mint.to_account_info(),
        to: beneficiary_token_account.to_account_info(),
        authority: ctx.accounts.lock_token_account.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);

    token_2022::transfer_checked(cpi_ctx, lock.amount_per_payout, ctx.accounts.mint.decimals)?;

    lock.num_payments_made = lock.num_payments_made + 1;

    Ok(())
}
