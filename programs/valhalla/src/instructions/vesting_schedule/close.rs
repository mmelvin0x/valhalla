use anchor_lang::prelude::*;
use anchor_spl::token_interface::{
    close_account, CloseAccount, Mint, TokenAccount, TokenInterface,
};

use crate::{constants, VestingSchedule};

#[derive(Accounts)]
pub struct CloseVestingSchedule<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,

    #[account(
        mut,
        close = creator,
        seeds = [
            creator.key().as_ref(),
            mint.key().as_ref(),
            constants::TOKEN_LOCK_SEED
        ],
        bump,
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

    pub mint: InterfaceAccount<'info, Mint>,

    pub token_program: Interface<'info, TokenInterface>,
}

impl<'info> CloseVestingSchedule<'info> {
    pub fn close(&mut self) -> Result<()> {
        let lock_key = self.vesting_schedule.key();
        let signer_seeds: &[&[&[u8]]] = &[&[
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
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer_seeds);

        close_account(cpi_ctx)
    }
}
