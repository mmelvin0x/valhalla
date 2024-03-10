use anchor_lang::{prelude::*, system_program};
use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{transfer_checked, Mint, TokenAccount, TokenInterface, TransferChecked},
};

use crate::{
    constants,
    errors::ValhallaError,
    state::{Config, ScheduledPayment},
    Authority, VestingType,
};

#[derive(Accounts)]
pub struct CreateScheduledPayment<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,

    pub recipient: SystemAccount<'info>,

    #[account(seeds = [constants::CONFIG_SEED], bump, has_one = treasury)]
    pub config: Account<'info, Config>,

    #[account(mut, constraint = config.treasury == treasury.key())]
    pub treasury: SystemAccount<'info>,

    #[account(
        init,
        payer = creator,
        seeds = [
            creator.key().as_ref(),
            recipient.key().as_ref(),
            mint.key().as_ref(),
            constants::SCHEDULED_PAYMENT_SEED,
        ],
        space = ScheduledPayment::INIT_SPACE,
        bump
    )]
    pub scheduled_payment: Box<Account<'info, ScheduledPayment>>,

    #[account(
        init,
        seeds = [scheduled_payment.key().as_ref(), constants::SCHEDULED_PAYMENT_TOKEN_ACCOUNT_SEED],
        bump,
        payer = creator,
        token::mint = mint,
        token::authority = scheduled_payment_token_account,
        token::token_program = token_program
    )]
    pub scheduled_payment_token_account: InterfaceAccount<'info, TokenAccount>,

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

impl<'info> CreateScheduledPayment<'info> {
    pub fn create(
        &mut self,
        name: [u8; 32],
        amount_to_be_vested: u64,
        total_vesting_duration: u64,
        cancel_authority: Authority,
        change_recipient_authority: Authority,
    ) -> Result<()> {
        let amount = self.validate_deposit(amount_to_be_vested)?;

        self.set_state(
            name,
            total_vesting_duration,
            cancel_authority,
            change_recipient_authority,
        )?;

        self.transfer(amount)?;

        self.take_fee()
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
            to: self.scheduled_payment_token_account.to_account_info(),
            authority: self.creator.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);

        transfer_checked(cpi_ctx, amount, self.mint.decimals)
    }

    fn set_state(
        &mut self,
        name: [u8; 32],
        total_vesting_duration: u64,
        cancel_authority: Authority,
        change_recipient_authority: Authority,
    ) -> Result<()> {
        self.scheduled_payment.set_inner(ScheduledPayment {
            creator: self.creator.key(),
            recipient: self.recipient.key(),
            mint: self.mint.key(),
            name,
            total_vesting_duration,
            created_timestamp: Clock::get()?.unix_timestamp as u64,
            cancel_authority,
            change_recipient_authority,
            vesting_type: VestingType::ScheduledPayment,
        });

        Ok(())
    }

    fn validate_deposit(&mut self, amount_to_be_vested: u64) -> Result<u64> {
        let balance = self.creator_token_account.amount;
        let amount = amount_to_be_vested
            .checked_mul((10u64).pow(self.mint.decimals as u32))
            .unwrap();

        if amount > balance {
            return Err(ValhallaError::InsufficientFundsForDeposit.into());
        }

        Ok(amount)
    }
}
