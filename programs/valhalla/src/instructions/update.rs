use anchor_lang::prelude::*;
use anchor_spl::{ token_interface::{ Mint, Token2022 }, associated_token::AssociatedToken };

use crate::{ constants, Lock, Authority, errors::LockError };

#[derive(Accounts)]
pub struct Update<'info> {
    #[account(mut, constraint = funder.key() == signer.key() || beneficiary.key() == signer.key())]
    pub signer: Signer<'info>,

    #[account(mut, constraint = lock.funder == funder.key())]
    /// CHECK: Checked in contstraints
    pub funder: AccountInfo<'info>,

    #[account(mut, constraint = lock.beneficiary == beneficiary.key())]
    /// CHECK: Checked in constraints
    pub beneficiary: AccountInfo<'info>,

    /// CHECK: Checked in constraints
    pub new_beneficiary: AccountInfo<'info>,

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

    pub mint: InterfaceAccount<'info, Mint>,

    pub token_program: Program<'info, Token2022>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

pub fn update_ix(ctx: Context<Update>) -> Result<()> {
    let lock = &mut ctx.accounts.lock;

    // Check the change recipient authority
    match lock.change_recipient_authority {
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

    lock.beneficiary = ctx.accounts.new_beneficiary.key();

    Ok(())
}
