use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_2022::{ self as token, TransferChecked, CloseAccount },
    token_interface::{ Token2022, TokenAccount, Mint },
};

use crate::{ constants, errors::LockError, state::Lock, Authority };

#[derive(Accounts)]
pub struct Cancel<'info> {
    #[account(mut, constraint = funder.key() == signer.key() || beneficiary.key() == signer.key())]
    pub signer: Signer<'info>,

    #[account(mut, constraint = lock.funder == funder.key())]
    /// CHECK: Checked in contstraints
    pub funder: AccountInfo<'info>,

    #[account(mut, constraint = lock.beneficiary == beneficiary.key())]
    /// CHECK: Checked in constraints
    pub beneficiary: AccountInfo<'info>,

    #[account(
        mut,
        close = funder,
        seeds = [
            funder.key().as_ref(),
            mint.key().as_ref(),
            constants::LOCK_SEED,
        ],
        bump,
        has_one = beneficiary,
        has_one = funder,
        has_one = mint,
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
        associated_token::authority = funder
    )]
    pub funder_token_account: InterfaceAccount<'info, TokenAccount>,

    pub mint: InterfaceAccount<'info, Mint>,

    pub token_program: Program<'info, Token2022>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

pub fn cancel_ix(ctx: Context<Cancel>) -> Result<()> {
    let lock = &mut ctx.accounts.lock;

    // Check the cancel authority
    match lock.cancel_authority {
        Authority::Neither => {
            return Err(LockError::Unauthorized.into());
        }
        Authority::Funder => {
            if ctx.accounts.funder.key() != ctx.accounts.signer.key() {
                return Err(LockError::Unauthorized.into());
            }
        }
        Authority::Beneficiary => {
            if ctx.accounts.beneficiary.key() != ctx.accounts.signer.key() {
                return Err(LockError::Unauthorized.into());
            }
        }
        Authority::Both => {
            if
                ctx.accounts.funder.key() != ctx.accounts.signer.key() ||
                ctx.accounts.beneficiary.key() != ctx.accounts.signer.key()
            {
                return Err(LockError::Unauthorized.into());
            }
        }
    }

    // If the lock token account has a balance, transfer it to the funder
    if ctx.accounts.lock_token_account.amount > 0 {
        let lock_key = ctx.accounts.lock.to_account_info().key();
        let creator_key = ctx.accounts.funder.to_account_info().key();
        let mint_key = ctx.accounts.mint.to_account_info().key();

        let lock_token_account = &ctx.accounts.lock_token_account;
        let creator_token_account = &ctx.accounts.funder_token_account;

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

        let cpi_accounts = TransferChecked {
            from: lock_token_account.to_account_info(),
            mint: ctx.accounts.mint.to_account_info(),
            to: creator_token_account.to_account_info(),
            authority: ctx.accounts.lock_token_account.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);

        token::transfer_checked(
            cpi_ctx,
            ctx.accounts.lock_token_account.amount,
            ctx.accounts.mint.decimals
        )?;

        // Close the lock token account
        let cpi_accounts = CloseAccount {
            account: ctx.accounts.lock_token_account.to_account_info(),
            destination: ctx.accounts.funder.to_account_info(),
            authority: ctx.accounts.lock_token_account.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);

        token::close_account(cpi_ctx)?;
    }

    Ok(())
}
