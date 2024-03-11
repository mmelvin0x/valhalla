use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{
        close_account, transfer_checked, CloseAccount, Mint, TokenAccount, TokenInterface,
        TransferChecked,
    },
};

use crate::{constants, errors::ValhallaError, state::VestingSchedule, Authority};

#[derive(Accounts)]
pub struct CancelVestingSchedule<'info> {
    #[account(mut, constraint = creator.key() == signer.key() || recipient.key() == signer.key())]
    pub signer: Signer<'info>,

    #[account(mut, constraint = vesting_schedule.creator == creator.key())]
    pub creator: SystemAccount<'info>,

    #[account(mut, constraint = vesting_schedule.recipient == recipient.key())]
    pub recipient: SystemAccount<'info>,

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

    pub token_program: Interface<'info, TokenInterface>,

    pub associated_token_program: Program<'info, AssociatedToken>,

    pub system_program: Program<'info, System>,
}

impl<'info> CancelVestingSchedule<'info> {
    pub fn cancel(&mut self) -> Result<()> {
        self.validate_authority()?;

        if self.vesting_schedule_token_account.amount > 0 {
            self.transfer()?
        }

        self.close()
    }

    fn close(&mut self) -> Result<()> {
        let lock_key = self.vesting_schedule.to_account_info().key();
        let signer: &[&[&[u8]]] = &[&[
            lock_key.as_ref(),
            constants::VESTING_SCHEDULE_TOKEN_ACCOUNT_SEED,
            &[self.vesting_schedule.token_account_bump],
        ]];

        let cpi_accounts = CloseAccount {
            account: self.vesting_schedule_token_account.to_account_info(),
            destination: self.creator.to_account_info(),
            authority: self.vesting_schedule_token_account.to_account_info(),
        };
        let cpi_program = self.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);

        close_account(cpi_ctx)
    }

    fn transfer(&mut self) -> Result<()> {
        let vesting_schedule_token_account = &self.vesting_schedule_token_account;
        let creator_token_account = &self.creator_token_account;

        let lock_key = self.vesting_schedule.to_account_info().key();

        let signer: &[&[&[u8]]] = &[&[
            lock_key.as_ref(),
            constants::VESTING_SCHEDULE_TOKEN_ACCOUNT_SEED,
            &[self.vesting_schedule.token_account_bump],
        ]];

        let cpi_accounts = TransferChecked {
            from: vesting_schedule_token_account.to_account_info(),
            mint: self.mint.to_account_info(),
            to: creator_token_account.to_account_info(),
            authority: self.vesting_schedule_token_account.to_account_info(),
        };
        let cpi_program = self.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);

        transfer_checked(
            cpi_ctx,
            self.vesting_schedule_token_account.amount,
            self.mint.decimals,
        )
    }

    fn validate_authority(&mut self) -> Result<()> {
        match self.vesting_schedule.cancel_authority {
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

        Ok(())
    }
}
