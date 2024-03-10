use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{
        close_account, transfer_checked, CloseAccount, Mint, TokenAccount, TokenInterface,
        TransferChecked,
    },
};

use crate::{constants, errors::ValhallaError, state::VestingSchedule};

#[derive(Accounts)]
pub struct DisburseVestingSchedule<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    pub creator: SystemAccount<'info>,

    pub recipient: SystemAccount<'info>,

    #[account(
        mut,
        seeds = [
            creator.key().as_ref(),
            recipient.key().as_ref(),
            mint.key().as_ref(),
            constants::VESTING_SCHEDULE_SEED
        ],
        bump,
        has_one = recipient
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
        associated_token::authority = recipient
    )]
    pub recipient_token_account: InterfaceAccount<'info, TokenAccount>,

    pub mint: InterfaceAccount<'info, Mint>,

    pub token_program: Interface<'info, TokenInterface>,

    pub associated_token_program: Program<'info, AssociatedToken>,

    pub system_program: Program<'info, System>,
}

impl<'info> DisburseVestingSchedule<'info> {
    pub fn disburse(&mut self, bump: u8) -> Result<()> {
        let mut transfer_amount;
        let current_time = Clock::get()?.unix_timestamp as u64;

        if self.can_disburse()? {
            transfer_amount = self.get_transfer_amount(current_time);
        } else {
            return Err(ValhallaError::Locked.into());
        }

        if transfer_amount > 0 {
            if transfer_amount > self.vesting_schedule_token_account.amount {
                transfer_amount = self.vesting_schedule_token_account.amount;
            }

            self.transfer(transfer_amount, bump)?;
        } else {
            return Err(ValhallaError::NoPayout.into());
        }

        if self.vesting_schedule_token_account.amount == 0 {
            self.close(bump)?;
            self.close_pdas()?;
        }

        Ok(())
    }

    fn can_disburse(&self) -> Result<bool> {
        let current_time = Clock::get()?.unix_timestamp as u64;
        Ok(self.vesting_schedule.start_date <= current_time)
    }

    fn has_cliff_payment(&self) -> bool {
        self.vesting_schedule.cliff_payment_amount > 0
            && !self.vesting_schedule.is_cliff_payment_disbursed
    }

    fn is_end_date_reached(&self, current_time: u64) -> bool {
        self.vesting_schedule
            .start_date
            .checked_add(self.vesting_schedule.total_vesting_duration)
            .unwrap_or_default()
            <= current_time
    }

    fn get_num_payments_owed(&self, current_time: u64) -> u64 {
        current_time
            .checked_sub(self.vesting_schedule.start_date)
            .unwrap()
            .checked_div(self.vesting_schedule.payout_interval)
            .unwrap()
            .checked_sub(self.vesting_schedule.number_of_payments_made)
            .unwrap()
            .checked_add(1)
            .unwrap()
    }

    fn get_num_payments_made(&self, num_payments_owed: u64) -> u64 {
        self.vesting_schedule
            .number_of_payments_made
            .checked_add(num_payments_owed)
            .unwrap()
    }

    fn get_transfer_amount(&mut self, current_time: u64) -> u64 {
        let num_payments_owed = self.get_num_payments_owed(current_time);

        // Add the amount per payout multiplied by the number of payments owed to the recipient
        let mut transfer_amount = self
            .vesting_schedule
            .amount_per_payout
            .checked_mul(num_payments_owed)
            .unwrap();

        // Update the number of payments made
        self.vesting_schedule.number_of_payments_made =
            self.get_num_payments_made(num_payments_owed);

        // If the vesting_schedule has a cliff payment, we need to check if it has been disbursed and if not,
        // add it to the transfer amount and mark it as disbursed
        if self.has_cliff_payment() {
            transfer_amount = transfer_amount
                .checked_add(self.vesting_schedule.cliff_payment_amount)
                .unwrap();
            self.vesting_schedule.is_cliff_payment_disbursed = true;
        }

        // If the vesting end date is reached, release all of the tokens
        if self.is_end_date_reached(current_time) {
            // Set the transfer amount to the amount in the vesting_schedule token account
            transfer_amount = self.vesting_schedule_token_account.amount;

            // Set the number of payments made to the total number of payments possible
            self.vesting_schedule.number_of_payments_made = self
                .vesting_schedule
                .total_vesting_duration
                .checked_div(self.vesting_schedule.payout_interval)
                .unwrap_or_default();
        }

        transfer_amount
    }

    fn transfer(&mut self, transfer_amount: u64, bump: u8) -> Result<()> {
        let lock_key = self.vesting_schedule.key();
        let signer_seeds: &[&[&[u8]]] = &[&[
            lock_key.as_ref(),
            constants::VESTING_SCHEDULE_TOKEN_ACCOUNT_SEED,
            &[bump],
        ]];
        let cpi_program = self.token_program.to_account_info();
        let cpi_accounts = TransferChecked {
            from: self.vesting_schedule_token_account.to_account_info(),
            mint: self.mint.to_account_info(),
            to: self.recipient_token_account.to_account_info(),
            authority: self.vesting_schedule_token_account.to_account_info(),
        };
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer_seeds);

        transfer_checked(cpi_ctx, transfer_amount, self.mint.decimals)
    }

    fn close(&mut self, bump: u8) -> Result<()> {
        let lock_key = self.vesting_schedule.key();
        let signer_seeds: &[&[&[u8]]] = &[&[
            lock_key.as_ref(),
            constants::VESTING_SCHEDULE_TOKEN_ACCOUNT_SEED,
            &[bump],
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

    fn close_pdas(&mut self) -> Result<()> {
        let lamps = **self
            .vesting_schedule
            .to_account_info()
            .try_borrow_mut_lamports()?;
        **self
            .vesting_schedule
            .to_account_info()
            .try_borrow_mut_lamports()? -= lamps;
        **self.creator.to_account_info().try_borrow_mut_lamports()? += lamps;

        Ok(())
    }
}
