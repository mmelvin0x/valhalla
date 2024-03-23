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
pub struct CancelVault<'info> {
    #[account(mut, constraint = creator.key() == signer.key() || recipient.key() == signer.key())]
    pub signer: Signer<'info>,

    #[account(mut, constraint = vault.creator == creator.key())]
    pub creator: SystemAccount<'info>,

    #[account(mut, constraint = vault.recipient == recipient.key())]
    pub recipient: SystemAccount<'info>,

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

    #[account(
        init_if_needed,
        payer = signer,
        associated_token::mint = mint,
        associated_token::authority = creator
    )]
    pub creator_ata: InterfaceAccount<'info, TokenAccount>,

    pub mint: InterfaceAccount<'info, Mint>,

    pub token_program: Interface<'info, TokenInterface>,

    pub associated_token_program: Program<'info, AssociatedToken>,

    pub system_program: Program<'info, System>,
}

impl<'info> CancelVault<'info> {
    pub fn cancel(&mut self) -> Result<()> {
        self.validate_cancel_authority()?;

        match self.vault_ata.amount {
            0 => self.close_vault_ata(),
            _ => {
                self.transfer()?;
                self.close_vault_ata()
            }
        }
    }

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
                    && self.recipient.key() != self.signer.key()
                {
                    return Err(ValhallaError::Unauthorized.into());
                }
            }
        }

        Ok(())
    }

    fn transfer(&mut self) -> Result<()> {
        let lock_key = self.vault.to_account_info().key();
        let signer: &[&[&[u8]]] = &[&[
            lock_key.as_ref(),
            constants::VAULT_ATA_SEED,
            &[self.vault.token_account_bump],
        ]];

        let cpi_accounts = TransferChecked {
            from: self.vault_ata.to_account_info(),
            mint: self.mint.to_account_info(),
            to: self.creator_ata.to_account_info(),
            authority: self.vault_ata.to_account_info(),
        };
        let cpi_program = self.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);

        transfer_checked(cpi_ctx, self.vault_ata.amount, self.mint.decimals)
    }

    fn close_vault_ata(&self) -> Result<()> {
        let lock_key = self.vault.to_account_info().key();
        let signer: &[&[&[u8]]] = &[&[
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
