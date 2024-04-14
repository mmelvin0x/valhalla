use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{
        mint_to, transfer_checked, Mint, MintTo, TokenAccount, TokenInterface, TransferChecked,
    },
};

use crate::{constants, Config, ValhallaError, Vault};

#[derive(Accounts)]
pub struct DisburseVault<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    pub creator: SystemAccount<'info>,

    pub recipient: SystemAccount<'info>,

    #[account(mut)]
    pub dev_treasury: SystemAccount<'info>,

    #[account(seeds = [constants::CONFIG_SEED], bump, has_one = dev_treasury)]
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
    pub vault: Box<Account<'info, Vault>>,

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
    pub vault_ata: Box<InterfaceAccount<'info, TokenAccount>>,

    #[account(
        init_if_needed,
        payer = signer,
        associated_token::mint = governance_token_mint,
        associated_token::authority = signer,
        associated_token::token_program = governance_token_program,
    )]
    pub signer_governance_ata: Box<InterfaceAccount<'info, TokenAccount>>,

    #[account(
        init_if_needed,
        payer = signer,
        associated_token::mint = governance_token_mint,
        associated_token::authority = creator,
        associated_token::token_program = governance_token_program,
    )]
    pub creator_governance_ata: Box<InterfaceAccount<'info, TokenAccount>>,

    #[account(
        init_if_needed,
        payer = signer,
        associated_token::mint = mint,
        associated_token::authority = recipient,
        associated_token::token_program = token_program,
    )]
    pub recipient_ata: Box<InterfaceAccount<'info, TokenAccount>>,

    pub mint: InterfaceAccount<'info, Mint>,

    #[account(
        mut,
        mint::decimals = 9,
        mint::authority = governance_token_mint,
        mint::token_program = governance_token_program,
        seeds = [constants::GOVERNANCE_TOKEN_MINT_SEED],
        bump,
    )]
    pub governance_token_mint: InterfaceAccount<'info, Mint>,

    pub token_program: Interface<'info, TokenInterface>,

    pub governance_token_program: Interface<'info, TokenInterface>,

    pub associated_token_program: Program<'info, AssociatedToken>,

    pub system_program: Program<'info, System>,
}

impl<'info> DisburseVault<'info> {
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

    fn get_transfer_amount(&self, current_time: u64, vault_balance: u64) -> Result<u64> {
        let amount_per_payout = self.vault.get_amount_per_payout()?;
        let amount = amount_per_payout.min(vault_balance);

        match self.vault.is_expired(current_time)? {
            true => Ok(vault_balance),
            false => Ok(amount),
        }
    }

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

    fn mint_governance_tokens(&self, bumps: &DisburseVaultBumps) -> Result<()> {
        let signer_seeds: &[&[&[u8]]] = &[&[
            constants::GOVERNANCE_TOKEN_MINT_SEED,
            &[bumps.governance_token_mint],
        ]];

        let to = if self.vault.autopay {
            self.creator_governance_ata.to_account_info()
        } else {
            self.signer_governance_ata.to_account_info()
        };

        let cpi_program = self.governance_token_program.to_account_info();
        let cpi_accounts = MintTo {
            to,
            mint: self.governance_token_mint.to_account_info(),
            authority: self.governance_token_mint.to_account_info(),
        };
        let cpi_context = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer_seeds);

        mint_to(cpi_context, self.config.governance_token_amount)
    }
}
