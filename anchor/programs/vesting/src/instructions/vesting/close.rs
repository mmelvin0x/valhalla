use anchor_lang::prelude::*;
use anchor_spl::token_interface::{
    close_account, CloseAccount, Mint, TokenAccount, TokenInterface,
};

use crate::{constants, ValhallaError, Vault};

#[derive(Accounts)]
pub struct CloseVault<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,

    #[account(
        mut,
        close = creator,
        seeds = [
            vault.identifier.to_le_bytes().as_ref(),
            creator.key().as_ref(),
            mint.key().as_ref(),
            constants::VAULT_SEED
        ],
        bump,
    )]
    pub vault: Account<'info, Vault>,

    #[account(
        mut,
        seeds = [
            vault.key().as_ref(),
            constants::VAULT_ATA_SEED
        ],
        bump = vault.token_account_bump,
        token::mint = mint,
        token::authority = vault_ata,
    )]
    pub vault_ata: InterfaceAccount<'info, TokenAccount>,

    pub mint: InterfaceAccount<'info, Mint>,

    pub token_program: Interface<'info, TokenInterface>,
}

impl<'info> CloseVault<'info> {
    pub fn close(&mut self) -> Result<()> {
        match self.vault.is_expired(Clock::get()?.unix_timestamp as u64)? {
            false => Err(ValhallaError::Locked.into()),
            true => match self.vault_ata.amount {
                0 => self.close_vault_ata(),
                _ => Err(ValhallaError::CloseVaultFailed.into()),
            },
        }
    }

    fn close_vault_ata(&mut self) -> Result<()> {
        let lock_key = self.vault.key();
        let signer_seeds: &[&[&[u8]]] = &[&[
            lock_key.as_ref(),
            constants::VAULT_ATA_SEED,
            &[self.vault.token_account_bump],
        ]];

        let cpi_accounts = CloseAccount {
            account: self.vault_ata.to_account_info(),
            destination: self.creator.to_account_info(),
            authority: self.vault_ata.to_account_info(),
        };
        let cpi_program = self.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer_seeds);

        close_account(cpi_ctx)
    }
}
