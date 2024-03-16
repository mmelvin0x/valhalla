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
/// Represents the instruction to create a vault.
pub struct CreateVault<'info> {
    /// The creator of the vault.
    #[account(mut)]
    pub creator: Signer<'info>,

    /// The recipient of the vault tokens.
    #[account(mut)]
    pub recipient: SystemAccount<'info>,

    /// The sol treasury account.
    #[account(mut)]
    pub sol_treasury: SystemAccount<'info>,

    /// The token treasury account.
    #[account(mut)]
    pub token_treasury: SystemAccount<'info>,

    /// The configuration account.
    #[account(seeds = [constants::CONFIG_SEED], bump, has_one = sol_treasury)]
    pub config: Box<Account<'info, Config>>,

    /// The vault account.
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

    /// The vault token account.
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
        associated_token::authority = token_treasury,
        associated_token::token_program = token_program,
    )]
    pub token_treasury_ata: Box<InterfaceAccount<'info, TokenAccount>>,

    /// The creator's token account.
    #[account(
        init_if_needed,
        payer = creator,
        associated_token::mint = mint,
        associated_token::authority = creator,
        associated_token::token_program = token_program,
    )]
    pub creator_ata: Box<InterfaceAccount<'info, TokenAccount>>,

    /// The creator's reward token account
    #[account(
        init_if_needed,
        payer = creator,
        associated_token::mint = governance_token_mint,
        associated_token::authority = creator,
        associated_token::token_program = governance_token_program,
    )]
    pub creator_reward_ata: Box<InterfaceAccount<'info, TokenAccount>>,

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

    /// The mint of the token.
    pub mint: InterfaceAccount<'info, Mint>,

    /// The token program for the mint.
    pub token_program: Interface<'info, TokenInterface>,

    /// The token program for the reward token.
    pub governance_token_program: Interface<'info, TokenInterface>,

    /// The associated token program.
    pub associated_token_program: Program<'info, AssociatedToken>,

    /// The system program.
    pub system_program: Program<'info, System>,
}

impl<'info> CreateVault<'info> {
    /// Creates a new vault with the specified parameters.
    ///
    /// # Arguments
    ///
    /// * `identifier` - The identifier of the vault.
    /// * `name` - The name of the vault.
    /// * `amount_to_be_vested` - The amount to be vested in the vault.
    /// * `total_vesting_duration` - The total duration of the vesting period.
    /// * `start_date` - The start date of the vesting period.
    /// * `total_number_of_payouts` - The total number of payouts to be made from the vault.
    /// * `cancel_authority` - The authority to cancel the vault.
    /// * `bump` - The bump value for the vault associated token account pda associated with the vault.
    ///
    /// # Errors
    ///
    /// This method returns an error if there are insufficient funds for the deposit or if any of the operations fail.
    ///
    /// # Returns
    ///
    /// This method returns `Ok(())` if the vault creation is successful.
    pub fn create(
        &mut self,
        identifier: u64,
        name: [u8; 32],
        amount_to_be_vested: u64,
        total_vesting_duration: u64,
        start_date: u64,
        payout_interval: u64,
        cancel_authority: Authority,
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
            self.token_treasury_ata.to_account_info(),
            self.creator.to_account_info(),
            self.mint.to_account_info(),
        )?;

        // Mint governance tokens to the creator
        self.mint_governance_tokens(bumps)?;

        // Transfer sol fee to the sol treasury
        self.transfer_sol()
    }

    /// Transfers the sol fee to the treasury.
    ///
    /// # Errors
    ///
    /// This method returns an error if there is an error during the CPI (Cross-Program Invocation) call.
    fn transfer_sol(&mut self) -> Result<()> {
        let from = self.creator.to_account_info();
        let to = self.sol_treasury.to_account_info();

        let transfer_ix = system_instruction::transfer(from.key, to.key, self.config.sol_fee);

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

    /// Transfers SPL tokens from the creator's token account to the vault token account.
    ///
    /// # Arguments
    ///
    /// * `amount` - The amount to be transferred to the vault token account.
    /// * `from` - The senders's token account.
    /// * `to` - The receivers's token account.
    /// * `authority` - The authority of the token account.
    /// * `mint` - The mint of the token.
    ///
    /// # Errors
    ///
    /// This method returns an error if there is an error during the CPI (Cross-Program Invocation) call.
    ///
    /// # Returns
    ///
    /// This method returns `Ok(())` if the transfer is successful.
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

    /// Mints governance tokens to the creator.
    ///
    /// # Arguments
    ///
    /// * `bumps` - The bump values for the accounts.
    ///
    /// # Errors
    ///
    /// This method returns an error if there is an error during the CPI (Cross-Program Invocation) call.
    fn mint_governance_tokens(&self, bumps: &CreateVaultBumps) -> Result<()> {
        match self.vault.cancel_authority {
            Authority::Neither => {
                let signer_seeds: &[&[&[u8]]] = &[&[
                    constants::REWARD_TOKEN_MINT_SEED,
                    &[bumps.governance_token_mint],
                ]];

                let cpi_program = self.governance_token_program.to_account_info();
                let cpi_accounts = MintTo {
                    mint: self.governance_token_mint.to_account_info(),
                    to: self.creator_reward_ata.to_account_info(),
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
