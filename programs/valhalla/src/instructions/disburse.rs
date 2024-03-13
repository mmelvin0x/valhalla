use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{transfer_checked, Mint, TokenAccount, TokenInterface, TransferChecked},
};

use crate::{constants, errors::ValhallaError, state::Vault};

#[derive(Accounts)]
/// Represents a disbursement of funds from a vault to a recipient.
pub struct DisburseVault<'info> {
    #[account(mut)]
    /// The signer of the transaction.
    pub signer: Signer<'info>,

    /// The creator of the vault.
    pub creator: SystemAccount<'info>,

    /// The recipient of the funds.
    pub recipient: SystemAccount<'info>,

    #[account(
        mut,
        seeds = [
            vault.identifier.to_le_bytes().as_ref(),
            creator.key().as_ref(),
            recipient.key().as_ref(),
            mint.key().as_ref(),
            constants::VAULT_SEED
        ],
        bump,
    )]
    /// The vault account from which the funds will be disbursed.
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

    #[account(
        init_if_needed,
        payer = signer,
        associated_token::mint = mint,
        associated_token::authority = recipient
    )]
    /// The associated token account for the recipient.
    pub recipient_token_account: InterfaceAccount<'info, TokenAccount>,

    /// The mint of the tokens being disbursed.
    pub mint: InterfaceAccount<'info, Mint>,

    /// The token program.
    pub token_program: Interface<'info, TokenInterface>,

    /// The associated token program.
    pub associated_token_program: Program<'info, AssociatedToken>,

    /// The system program.
    pub system_program: Program<'info, System>,
}

/// Struct representing the disbursement of a vault.
impl<'info> DisburseVault<'info> {
    /// Disburses funds from the vault to the recipient.
    ///
    /// # Errors
    ///
    /// Returns an error if the vault is locked or if there are no funds to disburse.
    pub fn disburse(&mut self) -> Result<()> {
        let current_time = Clock::get()?.unix_timestamp as u64;
        if self.is_locked(current_time)? {
            return Err(ValhallaError::Locked.into());
        }

        match self.calculate_amount(current_time)? {
            0 => Err(ValhallaError::NoPayout.into()),
            amount => {
                self.vault.last_payment_timestamp = current_time;
                self.vault.number_of_payments_made =
                    self.vault.number_of_payments_made.checked_add(1).unwrap();

                self.transfer(amount)
            }
        }
    }

    /// Checks if the vault is locked.
    ///
    /// # Arguments
    ///
    /// * `current_time` - The current time.
    ///
    /// # Returns
    ///
    /// This method returns `Ok(true)` if the vault is locked, `Ok(false)` otherwise.
    fn is_locked(&self, current_time: u64) -> Result<bool> {
        Ok(self.vault.start_date > current_time)
    }

    /// Calculates the amount to be disbursed from the vault.
    ///
    /// # Arguments
    ///
    /// * `current_time` - The current time.
    ///
    /// # Returns
    ///
    /// This method returns a Result containing the amount to be disbursed from the vault.
    fn calculate_amount(&mut self, current_time: u64) -> Result<u64> {
        let amount = self
            .vault
            .amount_per_payout
            .checked_mul(
                current_time
                    .checked_sub(self.vault.last_payment_timestamp)
                    .unwrap()
                    .checked_div(self.vault.payout_interval)
                    .unwrap()
                    .checked_add(1)
                    .unwrap(),
            )
            .unwrap();

        if self.should_disburse_all(amount, current_time)? {
            Ok(self.vault_ata.amount)
        } else {
            Ok(amount)
        }
    }

    /// Checks if the entire vault should be disbursed.
    ///
    /// # Arguments
    ///
    /// * `amount` - The amount to be disbursed.
    /// * `current_time` - The current time.
    ///
    /// # Returns
    ///
    /// This method returns `Ok(true)` if the entire vault should be disbursed, `Ok(false)` otherwise.
    fn should_disburse_all(&self, amount: u64, current_time: u64) -> Result<bool> {
        Ok(amount > self.vault_ata.amount || self.has_vault_expired(current_time)?)
    }

    /// Checks if the vault has reached it's total vesting duration.
    ///
    /// # Arguments
    ///
    /// * `current_time` - The current time.
    ///
    /// # Returns
    ///
    /// This method returns `Ok(true)` if the vault has reached it's total vesting duration, `Ok(false)` otherwise.
    fn has_vault_expired(&self, current_time: u64) -> Result<bool> {
        Ok(self
            .vault
            .start_date
            .checked_add(self.vault.total_vesting_duration)
            .unwrap()
            <= current_time)
    }

    /// Transfers the specified amount from the vault to the recipient.
    ///
    /// # Arguments
    ///
    /// * `amount` - The amount to transfer.
    ///
    /// # Errors
    ///
    /// Returns an error if the transfer fails.
    ///
    /// # Returns
    ///
    /// This method returns `Ok(())` if the transfer is successful.
    fn transfer(&mut self, amount: u64) -> Result<()> {
        let lock_key = self.vault.key();
        let id = self.vault.identifier.to_le_bytes();
        let signer_seeds: &[&[&[u8]]] = &[&[
            id.as_ref(),
            lock_key.as_ref(),
            constants::VAULT_ATA_SEED,
            &[self.vault.token_account_bump],
        ]];

        let cpi_program = self.token_program.to_account_info();
        let cpi_accounts = TransferChecked {
            from: self.vault_ata.to_account_info(),
            mint: self.mint.to_account_info(),
            to: self.recipient_token_account.to_account_info(),
            authority: self.vault_ata.to_account_info(),
        };
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer_seeds);

        msg!(
            "Transferring {} tokens from the vault to the recipient.",
            amount
        );
        msg!("DEBUG: Vault Balance Before: {}", self.vault_ata.amount);

        transfer_checked(cpi_ctx, amount, self.mint.decimals)?;

        msg!("DEBUG: Vault Balance After: {}", self.vault_ata.amount);

        Ok(())
    }
}
