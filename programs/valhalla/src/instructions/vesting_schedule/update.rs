use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{Mint, Token2022},
};

use crate::{constants, errors::ValhallaError, Authority, VestingSchedule};

#[derive(Accounts)]
pub struct UpdateVestingSchedule<'info> {
    #[account(mut, constraint = creator.key() == signer.key() || recipient.key() == signer.key())]
    pub signer: Signer<'info>,

    #[account(mut, constraint = vesting_schedule.creator == creator.key())]
    /// CHECK: Checked in contstraints
    pub creator: UncheckedAccount<'info>,

    #[account(mut, constraint = vesting_schedule.recipient == recipient.key())]
    /// CHECK: Checked in constraints
    pub recipient: UncheckedAccount<'info>,

    /// CHECK: Checked in constraints
    pub new_recipient: UncheckedAccount<'info>,

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

    pub mint: InterfaceAccount<'info, Mint>,

    pub token_program: Program<'info, Token2022>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

pub fn update_vesting_schedule_ix(ctx: Context<UpdateVestingSchedule>) -> Result<()> {
    let vesting_schedule = &mut ctx.accounts.vesting_schedule;

    // Check the change recipient authority
    match vesting_schedule.change_recipient_authority {
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

    vesting_schedule.recipient = ctx.accounts.new_recipient.key();

    Ok(())
}
