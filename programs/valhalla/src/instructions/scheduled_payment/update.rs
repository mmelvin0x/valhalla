use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{Mint, Token2022},
};

use crate::{constants, errors::ValhallaError, Authority, ScheduledPayment};

#[derive(Accounts)]
pub struct UpdateScheduledPayment<'info> {
    #[account(mut, constraint = funder.key() == signer.key() || recipient.key() == signer.key())]
    pub signer: Signer<'info>,

    #[account(mut, constraint = scheduled_payment.funder == funder.key())]
    /// CHECK: Checked in contstraints
    pub funder: AccountInfo<'info>,

    #[account(mut, constraint = scheduled_payment.recipient == recipient.key())]
    /// CHECK: Checked in constraints
    pub recipient: AccountInfo<'info>,

    /// CHECK: Checked in constraints
    pub new_recipient: AccountInfo<'info>,

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

    pub mint: InterfaceAccount<'info, Mint>,

    pub token_program: Program<'info, Token2022>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

pub fn update_scheduled_payment_ix(ctx: Context<UpdateScheduledPayment>) -> Result<()> {
    let scheduled_payment = &mut ctx.accounts.scheduled_payment;

    // Check the change recipient authority
    match scheduled_payment.change_recipient_authority {
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

    scheduled_payment.recipient = ctx.accounts.new_recipient.key();

    Ok(())
}
