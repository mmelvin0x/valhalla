use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{
        mint_to, transfer_checked, Mint, MintTo, TokenAccount, TokenInterface, TransferChecked,
    },
};
use solana_program::system_instruction;

use crate::{
    constants,
    state::{Config, Vault},
    Authority,
};

#[derive(Accounts)]
#[instruction(identifier: u64)]
pub struct CreateVault<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,

    #[account(mut)]
    pub recipient: SystemAccount<'info>,

    #[account(mut)]
    pub dev_treasury: SystemAccount<'info>,

    #[account(mut)]
    pub dao_treasury: SystemAccount<'info>,

    #[account(seeds = [constants::CONFIG_SEED], bump, has_one = dev_treasury)]
    pub config: Box<Account<'info, Config>>,

    #[account(
        init,
        payer = creator,
        seeds = [
            identifier.to_le_bytes().as_ref(),
            creator.key().as_ref(),
            mint.key().as_ref(),
            constants::VAULT_SEED,
        ],
        space = Vault::INIT_SPACE,
        bump
    )]
    pub vault: Box<Account<'info, Vault>>,

    #[account(
        init_if_needed,
        seeds = [
            vault.key().as_ref(),
            constants::VAULT_ATA_SEED
        ],
        bump,
        payer = creator,
        token::mint = mint,
        token::authority = vault_ata,
        token::token_program = token_program,
    )]
    pub vault_ata: Box<InterfaceAccount<'info, TokenAccount>>,

    #[account(
        init_if_needed,
        payer = creator,
        associated_token::mint = mint,
        associated_token::authority = dao_treasury,
        associated_token::token_program = token_program,
    )]
    pub dao_treasury_ata: Box<InterfaceAccount<'info, TokenAccount>>,

    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = creator,
        associated_token::token_program = token_program,
    )]
    pub creator_ata: Box<InterfaceAccount<'info, TokenAccount>>,

    #[account(
        init_if_needed,
        payer = creator,
        associated_token::mint = governance_token_mint,
        associated_token::authority = creator,
        associated_token::token_program = governance_token_program,
    )]
    pub creator_governance_ata: Box<InterfaceAccount<'info, TokenAccount>>,

    #[account(
        mut,
        mint::decimals = 9,
        mint::authority = governance_token_mint,
        mint::token_program = governance_token_program,
        seeds = [constants::GOVERNANCE_TOKEN_MINT_SEED],
        bump,
    )]
    pub governance_token_mint: InterfaceAccount<'info, Mint>,

    pub mint: InterfaceAccount<'info, Mint>,

    pub token_program: Interface<'info, TokenInterface>,

    pub governance_token_program: Interface<'info, TokenInterface>,

    pub associated_token_program: Program<'info, AssociatedToken>,

    pub system_program: Program<'info, System>,
}

impl<'info> CreateVault<'info> {
    pub fn create(
        &mut self,
        identifier: u64,
        name: [u8; 32],
        amount_to_be_vested: u64,
        total_vesting_duration: u64,
        start_date: u64,
        payout_interval: u64,
        cancel_authority: Authority,
        autopay: bool,
        bumps: &CreateVaultBumps,
    ) -> Result<()> {
        let mut deposit_amount = amount_to_be_vested
            .checked_mul((10u64).pow(self.mint.decimals as u32))
            .unwrap();

        let token_fee_amount = deposit_amount
            .checked_mul(self.config.token_fee_basis_points)
            .unwrap()
            .checked_div(constants::MAX_BASIS_POINTS)
            .unwrap();

        deposit_amount = deposit_amount.checked_sub(token_fee_amount).unwrap();

        // Set the vault state.
        let now = Clock::get()?.unix_timestamp as u64;
        self.vault.set_inner(Vault {
            identifier,
            name,
            creator: self.creator.key(),
            recipient: self.recipient.key(),
            mint: self.mint.key(),
            total_vesting_duration,
            created_timestamp: now,
            start_date,
            last_payment_timestamp: now,
            initial_deposit_amount: deposit_amount,
            total_number_of_payouts: (total_vesting_duration / payout_interval).max(1),
            payout_interval,
            number_of_payments_made: 0,
            cancel_authority,
            autopay,
            token_account_bump: bumps.vault_ata,
        });

        // Transfer the amount to the vault token account
        self.transfer(
            deposit_amount,
            self.creator_ata.to_account_info(),
            self.vault_ata.to_account_info(),
            self.creator.to_account_info(),
            self.mint.to_account_info(),
        )?;

        // Transfer the token fee to the treasury
        self.transfer(
            token_fee_amount,
            self.creator_ata.to_account_info(),
            self.dao_treasury_ata.to_account_info(),
            self.creator.to_account_info(),
            self.mint.to_account_info(),
        )?;

        // Mint governance tokens to the creator
        self.mint_governance_tokens(bumps)?;

        // Transfer sol fee to the dev treasury
        self.transfer_sol()
    }

    fn transfer_sol(&mut self) -> Result<()> {
        let from = self.creator.to_account_info();
        let to = self.dev_treasury.to_account_info();

        let transfer_ix = system_instruction::transfer(from.key, to.key, self.config.dev_fee);

        solana_program::program::invoke_signed(
            &transfer_ix,
            &[
                from,
                to,
                self.creator.to_account_info(),
                self.system_program.to_account_info(),
            ],
            &[],
        )?;

        Ok(())
    }

    fn transfer(
        &self,
        amount: u64,
        from: AccountInfo<'info>,
        to: AccountInfo<'info>,
        authority: AccountInfo<'info>,
        mint: AccountInfo<'info>,
    ) -> Result<()> {
        let cpi_program = self.token_program.to_account_info();
        let cpi_accounts = TransferChecked {
            from,
            to,
            authority,
            mint,
        };
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);

        transfer_checked(cpi_ctx, amount, self.mint.decimals)
    }

    fn mint_governance_tokens(&self, bumps: &CreateVaultBumps) -> Result<()> {
        match self.vault.cancel_authority {
            Authority::Neither => {
                let signer_seeds: &[&[&[u8]]] = &[&[
                    constants::GOVERNANCE_TOKEN_MINT_SEED,
                    &[bumps.governance_token_mint],
                ]];

                let cpi_program = self.governance_token_program.to_account_info();
                let cpi_accounts = MintTo {
                    mint: self.governance_token_mint.to_account_info(),
                    to: self.creator_governance_ata.to_account_info(),
                    authority: self.governance_token_mint.to_account_info(),
                };
                let cpi_context =
                    CpiContext::new_with_signer(cpi_program, cpi_accounts, signer_seeds);

                mint_to(cpi_context, self.config.governance_token_amount)
            }
            _ => Ok(()),
        }
    }
}
