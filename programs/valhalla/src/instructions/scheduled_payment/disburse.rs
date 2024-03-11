use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{transfer_checked, Mint, TokenAccount, TokenInterface, TransferChecked},
};

use crate::{constants, errors::ValhallaError, state::ScheduledPayment};

#[derive(Accounts)]
pub struct DisburseScheduledPayment<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    pub creator: SystemAccount<'info>,

    pub recipient: SystemAccount<'info>,

    #[account(
        init_if_needed,
        payer = signer,
        associated_token::mint = mint,
        associated_token::authority = recipient
    )]
    pub recipient_token_account: InterfaceAccount<'info, TokenAccount>,

    #[account(
        mut,
        close = creator,
        seeds = [
            creator.key().as_ref(),
            mint.key().as_ref(),
            constants::SCHEDULED_PAYMENT_SEED
        ],
        bump,
    )]
    pub scheduled_payment: Account<'info, ScheduledPayment>,

    #[account(
        mut,
        seeds = [scheduled_payment.key().as_ref(), constants::SCHEDULED_PAYMENT_TOKEN_ACCOUNT_SEED],
        bump,
        token::mint = mint,
        token::authority = payment_token_account,
    )]
    pub payment_token_account: InterfaceAccount<'info, TokenAccount>,

    pub mint: InterfaceAccount<'info, Mint>,

    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

impl<'info> DisburseScheduledPayment<'info> {
    pub fn disburse(&mut self) -> Result<()> {
        if self.can_disburse()? {
            self.transfer()
        } else {
            return Err(ValhallaError::Locked.into());
        }
    }

    fn transfer(&mut self) -> Result<()> {
        let lock_key = self.scheduled_payment.key();
        let signer_seeds: &[&[&[u8]]] = &[&[
            lock_key.as_ref(),
            constants::SCHEDULED_PAYMENT_TOKEN_ACCOUNT_SEED,
            &[self.scheduled_payment.token_account_bump],
        ]];

        let cpi_program = self.token_program.to_account_info();
        let cpi_accounts = TransferChecked {
            from: self.payment_token_account.to_account_info(),
            mint: self.mint.to_account_info(),
            to: self.recipient_token_account.to_account_info(),
            authority: self.payment_token_account.to_account_info(),
        };
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer_seeds);

        transfer_checked(
            cpi_ctx,
            self.payment_token_account.amount,
            self.mint.decimals,
        )
    }

    fn can_disburse(&mut self) -> Result<bool> {
        let current_time = Clock::get()?.unix_timestamp as u64;

        Ok(current_time
            .checked_sub(self.scheduled_payment.created_timestamp)
            .unwrap_or_default()
            >= self.scheduled_payment.total_vesting_duration)
    }
}
