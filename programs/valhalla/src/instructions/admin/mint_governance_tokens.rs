use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{mint_to, Mint, MintTo, TokenAccount, TokenInterface},
};

use crate::{constants, Config};

#[derive(Accounts)]
pub struct MintGovernanceTokens<'info> {
    #[account(mut)]
    /// The admin account that will sign the transaction.
    pub admin: Signer<'info>,

    #[account(mut)]
    /// The account that will receive the minted governance tokens.
    pub receiver: SystemAccount<'info>,

    #[account(
        mut,
        seeds = [constants::CONFIG_SEED],
        bump,
        has_one = admin,
    )]
    /// The config account
    pub config: Account<'info, Config>,

    #[account(
        mut,
        mint::decimals = 9,
        mint::authority = governance_token_mint,
        seeds = [constants::GOVERNANCE_TOKEN_MINT_SEED],
        bump,
    )]
    /// The governance token mint account.
    pub governance_token_mint: InterfaceAccount<'info, Mint>,

    #[account(
        init_if_needed,
        payer = admin,
        associated_token::mint = governance_token_mint,
        associated_token::authority = receiver,
    )]
    /// The receiver token account.
    pub receiver_token_account: InterfaceAccount<'info, TokenAccount>,

    /// The token program account.
    pub token_program: Interface<'info, TokenInterface>,

    /// The associated token program account.
    pub associated_token_program: Program<'info, AssociatedToken>,

    /// The system program account.
    pub system_program: Program<'info, System>,
}

impl<'info> MintGovernanceTokens<'info> {
    /// Mints governance tokens and deposits them into the receiver's token account.
    ///
    /// # Arguments
    ///
    /// * `amount` - The amount of governance tokens to mint.
    /// * `bumps` - The bump values for the accounts.
    ///
    /// # Errors
    ///
    /// Returns an error if the minting fails.
    pub fn mint_governance_tokens(
        &self,
        amount: u64,
        bumps: &MintGovernanceTokensBumps,
    ) -> Result<()> {
        let signer_seeds: &[&[&[u8]]] = &[&[
            constants::GOVERNANCE_TOKEN_MINT_SEED,
            &[bumps.governance_token_mint],
        ]];

        let cpi_program = self.token_program.to_account_info();
        let cpi_accounts = MintTo {
            mint: self.governance_token_mint.to_account_info(),
            to: self.receiver_token_account.to_account_info(),
            authority: self.governance_token_mint.to_account_info(),
        };

        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer_seeds);

        mint_to(cpi_ctx, amount)
    }
}
