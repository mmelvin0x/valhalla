use anchor_lang::prelude::*;
use anchor_spl::token_interface::{
    close_account, CloseAccount, Mint, TokenAccount, TokenInterface,
};

use crate::{constants, Vault};

#[derive(Accounts)]
/// Represents the instruction to close a vault.
pub struct CloseVault<'info> {
    #[account(mut)]
    /// The creator of the vault.
    pub creator: Signer<'info>,

    /// The recipient of the closed vault.
    pub recipient: SystemAccount<'info>,

    #[account(
        mut,
        close = creator,
        seeds = [
            vault.identifier.to_le_bytes().as_ref(),
            creator.key().as_ref(),
            recipient.key().as_ref(),
            mint.key().as_ref(),
            constants::VAULT_SEED
        ],
        bump,
    )]
    /// The vault account to be closed.
    pub vault: Account<'info, Vault>,

    #[account(
        mut,
        seeds = [
            vault.identifier.to_le_bytes().as_ref(),
            vault.key().as_ref(),
            constants::VAULT_ATA_SEED
        ],
        bump,
        token::mint = mint,
        token::authority = vault_ata,
    )]
    /// The associated token account for the vault.
    pub vault_ata: InterfaceAccount<'info, TokenAccount>,

    /// The mint account for the token.
    pub mint: InterfaceAccount<'info, Mint>,

    /// The token program interface.
    pub token_program: Interface<'info, TokenInterface>,
}

/// Implements the CloseVault instruction.
impl<'info> CloseVault<'info> {
    /// Closes the vault by transferring its funds to the creator's account.
    ///
    /// # Errors
    ///
    /// Returns an error if the close account CPI (Cross-Program Invocation) fails.
    pub fn close(&mut self) -> Result<()> {
        self.close_vault_token_account()
    }

    /// Closes the vault token account.
    ///
    /// # Errors
    ///
    /// Returns an error if the close account CPI (Cross-Program Invocation) fails.
    fn close_vault_token_account(&self) -> Result<()> {
        let lock_key = self.vault.key();
        let id = self.vault.identifier.to_le_bytes();
        let signer_seeds: &[&[&[u8]]] = &[&[
            id.as_ref(),
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
