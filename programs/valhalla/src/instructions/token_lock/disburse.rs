use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{
        close_account, transfer_checked, CloseAccount, Mint, TokenAccount, TokenInterface,
        TransferChecked,
    },
};

use crate::{constants, errors::ValhallaError, state::TokenLock};

#[derive(Accounts)]
pub struct DisburseTokenLock<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,

    #[account(
        init_if_needed,
        payer = creator,
        associated_token::mint = mint,
        associated_token::authority = creator,
        associated_token::token_program = token_program
    )]
    /// The creator's token account.
    pub creator_token_account: InterfaceAccount<'info, TokenAccount>,

    #[account(
        mut,
        close = creator,
        seeds = [
            creator.key().as_ref(),
            mint.key().as_ref(),
            constants::TOKEN_LOCK_SEED
        ],
        bump,
        has_one = mint,
        has_one = creator,
    )]
    pub token_lock: Account<'info, TokenLock>,

    #[account(
        mut,
        seeds = [token_lock.key().as_ref(), constants::TOKEN_LOCK_TOKEN_ACCOUNT_SEED],
        bump,
        token::mint = mint,
        token::authority = token_lock_token_account,
    )]
    pub token_lock_token_account: InterfaceAccount<'info, TokenAccount>,

    pub mint: InterfaceAccount<'info, Mint>,

    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

impl<'info> DisburseTokenLock<'info> {
    pub fn disburse(&mut self, bump: u8) -> Result<()> {
        let current_time = Clock::get()?.unix_timestamp as u64;

        if self.can_disburse(current_time) {
            self.transfer_to_recipient(bump)?;
            self.close_token_account(bump)
        } else {
            return Err(ValhallaError::Locked.into());
        }
    }

    fn can_disburse(&self, current_time: u64) -> bool {
        current_time
            .checked_sub(self.token_lock.created_timestamp)
            .unwrap_or_default()
            >= self.token_lock.total_vesting_duration
    }

    fn transfer_to_recipient(&mut self, bump: u8) -> Result<()> {
        let lock_key = self.token_lock.key();
        let signer_seeds: &[&[&[u8]]] = &[&[
            lock_key.as_ref(),
            constants::TOKEN_LOCK_TOKEN_ACCOUNT_SEED,
            &[bump],
        ]];
        let cpi_program = self.token_program.to_account_info();
        let cpi_accounts = TransferChecked {
            from: self.token_lock_token_account.to_account_info(),
            mint: self.mint.to_account_info(),
            to: self.creator_token_account.to_account_info(),
            authority: self.token_lock_token_account.to_account_info(),
        };
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer_seeds);

        transfer_checked(
            cpi_ctx,
            self.token_lock_token_account.amount,
            self.mint.decimals,
        )
    }

    fn close_token_account(&mut self, bump: u8) -> Result<()> {
        let lock_key = self.token_lock.key();
        let signer_seeds: &[&[&[u8]]] = &[&[
            lock_key.as_ref(),
            constants::TOKEN_LOCK_TOKEN_ACCOUNT_SEED,
            &[bump],
        ]];
        let cpi_accounts = CloseAccount {
            account: self.token_lock_token_account.to_account_info(),
            destination: self.creator.to_account_info(),
            authority: self.token_lock_token_account.to_account_info(),
        };
        let cpi_program = self.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer_seeds);

        close_account(cpi_ctx)
    }
}
