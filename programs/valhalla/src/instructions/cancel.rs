use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{
        close_account, transfer_checked, CloseAccount, Mint, TokenAccount, TokenInterface,
        TransferChecked,
    },
};

use crate::{constants, errors::ValhallaError, state::Vault, Authority};

#[derive(Accounts)]
/// Represents the accounts needed to cancel the vault.
/// This instruction cancels a vault and performs various account operations.
pub struct CancelVault<'info> {
    /// The signer account for the instruction.
    #[account(mut, constraint = creator.key() == signer.key() || recipient.key() == signer.key())]
    pub signer: Signer<'info>,

    /// The creator account of the vault.
    #[account(mut, constraint = vault.creator == creator.key())]
    pub creator: SystemAccount<'info>,

    /// The recipient account of the vault.
    #[account(mut, constraint = vault.recipient == recipient.key())]
    pub recipient: SystemAccount<'info>,

    /// The vault account to be closed.
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
    pub vault: Account<'info, Vault>,

    /// The associated token account for the vault.
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
    pub vault_ata: InterfaceAccount<'info, TokenAccount>,

    /// The creator's token account.
    #[account(
        init_if_needed,
        payer = signer,
        associated_token::mint = mint,
        associated_token::authority = creator
    )]
    pub creator_token_account: InterfaceAccount<'info, TokenAccount>,

    /// The mint account for the token.
    pub mint: InterfaceAccount<'info, Mint>,

    /// The token program interface.
    pub token_program: Interface<'info, TokenInterface>,

    /// The associated token program.
    pub associated_token_program: Program<'info, AssociatedToken>,

    /// The system program.
    pub system_program: Program<'info, System>,
}

/// Implements the `CancelVault` struct.
impl<'info> CancelVault<'info> {
    /// Cancels the vault.
    ///
    /// # Errors
    ///
    /// Returns an error if the authority is not valid or if there is an error during the transfer.
    pub fn cancel(&mut self) -> Result<()> {
        self.validate_cancel_authority()?;

        match self.vault_ata.amount {
            0 => self.close_vault_token_account(),
            _ => {
                self.transfer_from_vault_to_creator()?;
                self.close_vault_token_account()
            }
        }
    }

    /// Validates the authority to cancel the vault.
    ///
    /// # Errors
    ///
    /// Returns an error if the authority is not valid.
    fn validate_cancel_authority(&self) -> Result<()> {
        match self.vault.cancel_authority {
            Authority::Neither => {
                return Err(ValhallaError::Unauthorized.into());
            }
            Authority::Creator => {
                if self.creator.key() != self.signer.key() {
                    return Err(ValhallaError::Unauthorized.into());
                }
            }
            Authority::Recipient => {
                if self.recipient.key() != self.signer.key() {
                    return Err(ValhallaError::Unauthorized.into());
                }
            }
            Authority::Both => {
                if self.creator.key() != self.signer.key()
                    || self.recipient.key() != self.signer.key()
                {
                    return Err(ValhallaError::Unauthorized.into());
                }
            }
        }

        Ok(())
    }

    /// Transfers the remaining tokens from the vault to the creator's token account.
    ///
    /// # Errors
    ///
    /// Returns an error if there is an error during the CPI (Cross-Program Invocation) call.
    fn transfer_from_vault_to_creator(&mut self) -> Result<()> {
        let vault_ata = &self.vault_ata;
        let creator_token_account = &self.creator_token_account;

        let lock_key = self.vault.to_account_info().key();
        let id = self.vault.identifier.to_le_bytes();
        let signer: &[&[&[u8]]] = &[&[
            id.as_ref(),
            lock_key.as_ref(),
            constants::VAULT_ATA_SEED,
            &[self.vault.token_account_bump],
        ]];

        let cpi_accounts = TransferChecked {
            from: vault_ata.to_account_info(),
            mint: self.mint.to_account_info(),
            to: creator_token_account.to_account_info(),
            authority: self.vault_ata.to_account_info(),
        };
        let cpi_program = self.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);

        transfer_checked(cpi_ctx, self.vault_ata.amount, self.mint.decimals)
    }

    /// Closes the vault token account.
    ///
    /// # Errors
    ///
    /// Returns an error if there is an error during the CPI (Cross-Program Invocation) call.
    fn close_vault_token_account(&self) -> Result<()> {
        let lock_key = self.vault.to_account_info().key();
        let id = self.vault.identifier.to_le_bytes();
        let signer: &[&[&[u8]]] = &[&[
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
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);

        close_account(cpi_ctx)
    }
}
