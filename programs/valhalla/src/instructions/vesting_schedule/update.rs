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
    pub creator: SystemAccount<'info>,

    #[account(mut, constraint = vesting_schedule.recipient == recipient.key())]
    pub recipient: SystemAccount<'info>,

    pub new_recipient: SystemAccount<'info>,

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

impl<'info> UpdateVestingSchedule<'info> {
    pub fn update(&mut self) -> Result<()> {
        let vesting_schedule = &mut self.vesting_schedule;

        // Check the change recipient authority
        match vesting_schedule.change_recipient_authority {
            Authority::Neither => {
                return Err(ValhallaError::Unauthorized.into());
            }
            Authority::Creator => {
                if self.creator.key() != self.signer.key() {
                    return Err(ValhallaError::Unauthorized.into());
                }
            }
            Authority::Recipient => {
                if self.recipient.key() != self.signer.key() {
                    return Err(ValhallaError::Unauthorized.into());
                }
            }
            Authority::Both => {
                if self.creator.key() != self.signer.key()
                    || self.recipient.key() != self.signer.key()
                {
                    return Err(ValhallaError::Unauthorized.into());
                }
            }
        }

        vesting_schedule.recipient = self.new_recipient.key();

        Ok(())
    }
}
