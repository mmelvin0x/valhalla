use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{Mint, Token2022},
};

use crate::{constants, errors::ValhallaError, Authority, Vault};

#[derive(Accounts)]
/// Represents an update to a vault.
pub struct UpdateVault<'info> {
    /// The signer of the transaction, must be either the creator or the recipient of the vault.
    #[account(mut, constraint = creator.key() == signer.key() || recipient.key() == signer.key())]
    pub signer: Signer<'info>,

    /// The creator of the vault.
    #[account(mut, constraint = vault.creator == creator.key())]
    pub creator: SystemAccount<'info>,

    /// The recipient of the vault.
    #[account(mut, constraint = vault.recipient == recipient.key())]
    pub recipient: SystemAccount<'info>,

    /// The new recipient of the vault.
    pub new_recipient: SystemAccount<'info>,

    #[account(
        mut,
        close = creator,
        seeds = [
            vault.identifier.to_le_bytes().as_ref(),
            creator.key().as_ref(),
            recipient.key().as_ref(),
            mint.key().as_ref(),
            constants::VAULT_SEED,    
        ],
        bump,
    )]
    /// The vault account to update.
    pub vault: Account<'info, Vault>,

    /// The mint account associated with the vault.
    pub mint: InterfaceAccount<'info, Mint>,

    /// The token program.
    pub token_program: Program<'info, Token2022>,

    /// The associated token program.
    pub associated_token_program: Program<'info, AssociatedToken>,

    /// The system program.
    pub system_program: Program<'info, System>,
}

/// Implements the logic for updating a vault.
impl<'info> UpdateVault<'info> {
    /// Updates the vault with a new recipient.
    ///
    /// # Errors
    ///
    /// Returns an error if the change recipient authority is unauthorized.
    ///
    /// # Returns
    ///
    /// Returns `Ok(())` if the vault is successfully updated.
    pub fn update(&mut self) -> Result<()> {
        self.validate_change_recipient_authority()?;

        self.vault.recipient = self.new_recipient.key();

        Ok(())
    }

    /// Validates the authority to change the recipient of the vault.
    /// 
    /// # Errors
    /// 
    /// Returns an error if the authority is unauthorized.
    fn validate_change_recipient_authority(&self) -> Result<()> {
        match self.vault.change_recipient_authority {
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
}
