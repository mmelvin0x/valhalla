use anchor_lang::prelude::*;
use anchor_spl::token_interface::{
    close_account, CloseAccount, Mint, TokenAccount, TokenInterface,
};

use crate::{constants, ScheduledPayment};

#[derive(Accounts)]
pub struct CloseScheduledPayment<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,

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
}

impl<'info> CloseScheduledPayment<'info> {
    pub fn close(&mut self) -> Result<()> {
        let lock_key = self.scheduled_payment.key();
        let signer_seeds: &[&[&[u8]]] = &[&[
            lock_key.as_ref(),
            constants::VESTING_SCHEDULE_TOKEN_ACCOUNT_SEED,
            &[self.scheduled_payment.token_account_bump],
        ]];

        let cpi_accounts = CloseAccount {
            account: self.payment_token_account.to_account_info(),
            destination: self.creator.to_account_info(),
            authority: self.payment_token_account.to_account_info(),
        };
        let cpi_program = self.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer_seeds);

        close_account(cpi_ctx)
    }
}
