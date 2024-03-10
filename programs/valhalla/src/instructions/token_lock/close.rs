use anchor_lang::prelude::*;
use anchor_spl::token_interface::{
    close_account, CloseAccount, Mint, TokenAccount, TokenInterface,
};

use crate::{constants, TokenLock};

#[derive(Accounts)]
pub struct CloseTokenLock<'info> {
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
}

impl<'info> CloseTokenLock<'info> {
    pub fn close(&mut self, bump: u8) -> Result<()> {
        let lock_key = self.token_lock.key();
        let signer_seeds: &[&[&[u8]]] = &[&[
            lock_key.as_ref(),
            constants::VESTING_SCHEDULE_TOKEN_ACCOUNT_SEED,
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
