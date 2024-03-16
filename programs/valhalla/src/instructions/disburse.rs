use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{
        mint_to, transfer_checked, Mint, MintTo, TokenAccount, TokenInterface, TransferChecked,
    },
};

use crate::{constants, errors::ValhallaError, state::Vault, Config};

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

    /// The sol treasury account.
    #[account(mut)]
    pub sol_treasury: SystemAccount<'info>,

    /// The configuration account.
    #[account(seeds = [constants::CONFIG_SEED], bump, has_one = sol_treasury)]
    pub config: Box<Account<'info, Config>>,

    #[account(
        mut,
        seeds = [
            vault.identifier.to_le_bytes().as_ref(),
            creator.key().as_ref(),
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
            vault.key().as_ref(),
            constants::VAULT_ATA_SEED
        ],
        bump = vault.token_account_bump,
        token::mint = mint,
        token::authority = vault_ata,
        token::token_program = token_program,
    )]
    /// The associated token account for the vault.
    pub vault_ata: InterfaceAccount<'info, TokenAccount>,

    /// The signer's reward token account
    #[account(
        init_if_needed,
        payer = signer,
        associated_token::mint = governance_token_mint,
        associated_token::authority = signer,
        associated_token::token_program = governance_token_program,
    )]
    pub signer_reward_ata: InterfaceAccount<'info, TokenAccount>,

    #[account(
        init_if_needed,
        payer = signer,
        associated_token::mint = mint,
        associated_token::authority = recipient,
        associated_token::token_program = token_program,
    )]
    /// The associated token account for the recipient.
    pub recipient_ata: InterfaceAccount<'info, TokenAccount>,

    /// The mint of the tokens being disbursed.
    pub mint: InterfaceAccount<'info, Mint>,

    /// The reward token mint account.
    #[account(
        mut,
        mint::decimals = 9,
        mint::authority = governance_token_mint,
        mint::token_program = governance_token_program,
        seeds = [constants::REWARD_TOKEN_MINT_SEED],
        bump,
    )]
    pub governance_token_mint: InterfaceAccount<'info, Mint>,

    /// The token program.
    pub token_program: Interface<'info, TokenInterface>,

    /// The bump values for the accounts.
    pub governance_token_program: Interface<'info, TokenInterface>,

    /// The associated token program.
    pub associated_token_program: Program<'info, AssociatedToken>,

    /// The system program.
    pub system_program: Program<'info, System>,
}

impl<'info> DisburseVault<'info> {
    /// Disburses funds from the vault to the recipient.
    ///
    /// # Errors
    ///
    /// Returns an error if the vault is locked or if there are no funds to disburse.
    pub fn disburse(&mut self, bumps: &DisburseVaultBumps) -> Result<()> {
        let current_time = Clock::get()?.unix_timestamp as u64;
        require!(!self.vault.is_locked(current_time)?, ValhallaError::Locked);
        require!(self.vault_ata.amount > 0, ValhallaError::NoPayout);

        let transfer_amount = self.get_transfer_amount(current_time, self.vault_ata.amount)?;
        self.transfer(transfer_amount)?;

        self.vault.last_payment_timestamp = current_time;
        self.vault.number_of_payments_made = match transfer_amount == self.vault_ata.amount {
            true => self.vault.total_number_of_payouts,
            false => self.vault.number_of_payments_made.checked_add(1).unwrap(),
        };

        // Mint governance tokens to the creator
        self.mint_governance_tokens(bumps)
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
    fn get_transfer_amount(&self, current_time: u64, vault_balance: u64) -> Result<u64> {
        let amount_per_payout = self.vault.get_amount_per_payout()?;
        let amount = amount_per_payout.min(vault_balance);

        match self.vault.is_expired(current_time)? {
            true => Ok(vault_balance),
            false => Ok(amount),
        }
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
    fn transfer(&self, amount: u64) -> Result<()> {
        let lock_key = self.vault.key();
        let signer_seeds: &[&[&[u8]]] = &[&[
            lock_key.as_ref(),
            constants::VAULT_ATA_SEED,
            &[self.vault.token_account_bump],
        ]];

        let cpi_program = self.token_program.to_account_info();
        let cpi_accounts = TransferChecked {
            from: self.vault_ata.to_account_info(),
            mint: self.mint.to_account_info(),
            to: self.recipient_ata.to_account_info(),
            authority: self.vault_ata.to_account_info(),
        };
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer_seeds);

        transfer_checked(cpi_ctx, amount, self.mint.decimals)?;

        Ok(())
    }

    /// Mints governance tokens to the creator.
    ///
    /// # Arguments
    ///
    /// * `bumps` - The bump values for the accounts.
    ///
    /// # Errors
    ///
    /// This method returns an error if there is an error during the CPI (Cross-Program Invocation) call.
    fn mint_governance_tokens(&self, bumps: &DisburseVaultBumps) -> Result<()> {
        let signer_seeds: &[&[&[u8]]] = &[&[
            constants::REWARD_TOKEN_MINT_SEED,
            &[bumps.governance_token_mint],
        ]];

        let cpi_program = self.governance_token_program.to_account_info();
        let cpi_accounts = MintTo {
            mint: self.governance_token_mint.to_account_info(),
            to: self.signer_reward_ata.to_account_info(),
            authority: self.governance_token_mint.to_account_info(),
        };
        let cpi_context = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer_seeds);

        mint_to(cpi_context, self.config.governance_token_amount)
    }
}
