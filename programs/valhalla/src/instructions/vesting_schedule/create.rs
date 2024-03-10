use anchor_lang::{prelude::*, system_program};
use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{transfer_checked, Mint, TokenAccount, TokenInterface, TransferChecked},
};

use crate::{
    constants,
    errors::ValhallaError,
    state::{Config, VestingSchedule},
    Authority, VestingType,
};

#[derive(Accounts)]
pub struct CreateVestingSchedule<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,

    pub recipient: SystemAccount<'info>,

    #[account(seeds = [constants::CONFIG_SEED], bump, has_one = treasury)]
    pub config: Account<'info, Config>,

    #[account(mut)]
    pub treasury: SystemAccount<'info>,

    #[account(
        init,
        payer = creator,
        seeds = [
            creator.key().as_ref(),
            recipient.key().as_ref(),
            mint.key().as_ref(),
            constants::VESTING_SCHEDULE_SEED,
        ],
        space = VestingSchedule::INIT_SPACE,
        bump
    )]
    pub vesting_schedule: Account<'info, VestingSchedule>,

    #[account(
        init,
        seeds = [vesting_schedule.key().as_ref(), constants::VESTING_SCHEDULE_TOKEN_ACCOUNT_SEED],
        bump,
        payer = creator,
        token::mint = mint,
        token::authority = vesting_schedule_token_account,
        token::token_program = token_program
    )]
    pub vesting_schedule_token_account: InterfaceAccount<'info, TokenAccount>,

    #[account(
        init_if_needed,
        payer = creator,
        associated_token::mint = mint,
        associated_token::authority = creator,
        associated_token::token_program = token_program
    )]
    pub creator_token_account: InterfaceAccount<'info, TokenAccount>,

    #[account(
        init_if_needed,
        payer = creator,
        associated_token::mint = mint,
        associated_token::authority = recipient,
        associated_token::token_program = token_program
    )]
    pub recipient_token_account: InterfaceAccount<'info, TokenAccount>,

    pub mint: InterfaceAccount<'info, Mint>,

    pub token_program: Interface<'info, TokenInterface>,

    pub associated_token_program: Program<'info, AssociatedToken>,

    pub system_program: Program<'info, System>,
}

impl<'info> CreateVestingSchedule<'info> {
    pub fn create(
        &mut self,
        name: [u8; 32],
        amount_to_be_vested: u64,
        total_vesting_duration: u64,
        cancel_authority: Option<Authority>,
        change_recipient_authority: Option<Authority>,
        payout_interval: Option<u64>,
        cliff_payment_amount: Option<u64>,
        start_date: Option<u64>,
    ) -> Result<()> {
        if payout_interval.is_none() {
            return Err(ValhallaError::MissingOrInvalidPayoutInterval.into());
        }

        let payout_interval = payout_interval.unwrap();
        let cliff_payment_amount = cliff_payment_amount.unwrap_or(0);
        let start_date = start_date.unwrap_or(Clock::get()?.unix_timestamp as u64);
        let cancel_authority = cancel_authority.unwrap_or(Authority::Neither);
        let change_recipient_authority = change_recipient_authority.unwrap_or(Authority::Neither);

        let (mut amount, amount_per_payout, balance) =
            self.validate_deposit(amount_to_be_vested, total_vesting_duration, payout_interval)?;

        let cliff_payment = self.get_cliff_payment(cliff_payment_amount, amount, balance)?;

        self.set_state(
            name,
            total_vesting_duration,
            payout_interval,
            amount_per_payout,
            start_date,
            cliff_payment,
            0,
            false,
            cancel_authority,
            change_recipient_authority,
        )?;

        if cliff_payment > 0 {
            amount = self.handle_cliff_payment(amount, cliff_payment, start_date)?;
        }

        self.transfer(amount)?;

        self.take_fee()
    }

    fn get_cliff_payment(
        &self,
        cliff_payment_amount: u64,
        amount: u64,
        balance: u64,
    ) -> Result<u64> {
        let mut cliff_payment = 0;
        if cliff_payment_amount > 0 {
            cliff_payment = cliff_payment_amount
                .checked_mul((10u64).pow(self.mint.decimals as u32))
                .unwrap();

            if cliff_payment + amount > balance {
                return Err(ValhallaError::InsufficientFundsForDeposit.into());
            }

            Ok(cliff_payment)
        } else {
            Ok(cliff_payment)
        }
    }

    fn take_fee(&mut self) -> Result<()> {
        let cpi_program = self.system_program.to_account_info();
        let cpi_accounts = system_program::Transfer {
            from: self.creator.to_account_info(),
            to: self.treasury.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);

        system_program::transfer(cpi_ctx, self.config.fee)
    }

    fn transfer(&mut self, amount: u64) -> Result<()> {
        let cpi_program = self.token_program.to_account_info();
        let cpi_accounts = TransferChecked {
            from: self.creator_token_account.to_account_info(),
            mint: self.mint.to_account_info(),
            to: self.vesting_schedule_token_account.to_account_info(),
            authority: self.creator.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);

        transfer_checked(cpi_ctx, amount, self.mint.decimals)
    }

    fn handle_cliff_payment(
        &mut self,
        amount: u64,
        cliff_payment: u64,
        start_date: u64,
    ) -> Result<u64> {
        match start_date {
            0 => {
                self.vesting_schedule.cliff_payment_amount = cliff_payment;
                self.vesting_schedule.is_cliff_payment_disbursed = true;
                self.vesting_schedule.start_date = Clock::get()?.unix_timestamp as u64;
                self.disburse_cliff_payment(cliff_payment)?;

                Ok(amount)
            }
            _ => {
                self.vesting_schedule.cliff_payment_amount = cliff_payment;

                Ok(amount.checked_add(cliff_payment).unwrap())
            }
        }
    }

    fn disburse_cliff_payment(&mut self, cliff_payment: u64) -> Result<()> {
        let cpi_program = self.token_program.to_account_info();
        let cpi_accounts = TransferChecked {
            from: self.creator_token_account.to_account_info(),
            mint: self.mint.to_account_info(),
            to: self.recipient_token_account.to_account_info(),
            authority: self.creator.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);

        transfer_checked(cpi_ctx, cliff_payment, self.mint.decimals)
    }

    fn set_state(
        &mut self,
        name: [u8; 32],
        total_vesting_duration: u64,
        payout_interval: u64,
        amount_per_payout: u64,
        start_date: u64,
        cliff_payment_amount: u64,
        number_of_payments_made: u64,
        is_cliff_payment_disbursed: bool,
        cancel_authority: Authority,
        change_recipient_authority: Authority,
    ) -> Result<()> {
        self.vesting_schedule.set_inner(VestingSchedule {
            creator: self.creator.key(),
            recipient: self.recipient.key(),
            mint: self.mint.key(),
            name,
            total_vesting_duration,
            payout_interval,
            amount_per_payout,
            start_date,
            cliff_payment_amount,
            created_timestamp: Clock::get()?.unix_timestamp as u64,
            last_payment_timestamp: Clock::get()?.unix_timestamp as u64,
            number_of_payments_made,
            is_cliff_payment_disbursed,
            cancel_authority,
            change_recipient_authority,
            vesting_type: VestingType::VestingSchedule,
        });

        Ok(())
    }

    fn validate_deposit(
        &mut self,
        amount_to_be_vested: u64,
        total_vesting_duration: u64,
        payout_interval: u64,
    ) -> Result<(u64, u64, u64)> {
        let balance = self.creator_token_account.amount;
        let amount = amount_to_be_vested
            .checked_mul((10u64).pow(self.mint.decimals as u32))
            .unwrap();

        if amount > balance {
            return Err(ValhallaError::InsufficientFundsForDeposit.into());
        }

        let total_payouts = total_vesting_duration.checked_div(payout_interval).unwrap();
        let amount_per_payout = amount.checked_div(total_payouts).unwrap();
        let total_payout_amount = amount_per_payout.checked_mul(total_payouts).unwrap();
        if total_payout_amount > amount {
            return Err(ValhallaError::InsufficientFundsForDeposit.into());
        }

        Ok((amount, amount_per_payout, balance))
    }
}
