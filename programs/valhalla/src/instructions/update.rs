use anchor_lang::prelude::*;
use anchor_spl::{ token_interface::{ Mint, Token2022 }, associated_token::AssociatedToken };

use crate::{ constants, Lock, Authority, errors::LockError, events::LockUpdated };

#[derive(Accounts)]
pub struct Update<'info> {
    #[account(mut, constraint = funder.key() == signer.key() || recipient.key() == signer.key())]
    pub signer: Signer<'info>,

    #[account(mut, constraint = lock.funder == funder.key())]
    /// CHECK: Checked in contstraints
    pub funder: AccountInfo<'info>,

    #[account(mut, constraint = lock.recipient == recipient.key())]
    /// CHECK: Checked in constraints
    pub recipient: AccountInfo<'info>,

    /// CHECK: Checked in constraints
    pub new_recipient: AccountInfo<'info>,

    #[account(
        mut,
        close = funder,
        seeds = [
            funder.key().as_ref(),
            mint.key().as_ref(),
            constants::LOCK_SEED,
        ],
        bump,
        has_one = recipient,
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
        Authority::Recipient => {
            if ctx.accounts.recipient.key() != ctx.accounts.signer.key() {
                return Err(LockError::Unauthorized.into());
            }
        }
        Authority::Both => {
            if
                ctx.accounts.funder.key() != ctx.accounts.signer.key() ||
                ctx.accounts.recipient.key() != ctx.accounts.signer.key()
            {
                return Err(LockError::Unauthorized.into());
            }
        }
    }

    lock.recipient = ctx.accounts.new_recipient.key();

    emit!(LockUpdated {
        recipient: ctx.accounts.new_recipient.key(),
        funder: ctx.accounts.funder.key(),
        updated_by: ctx.accounts.signer.key(),
        mint: ctx.accounts.mint.key(),
        name: ctx.accounts.lock.name.clone(),
    });

    Ok(())
}
