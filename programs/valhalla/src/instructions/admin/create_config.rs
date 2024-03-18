use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{Mint, TokenInterface},
};

use crate::{constants, errors::ValhallaError, state::Config};

/// Accounts required to create a configuration.
#[derive(Accounts)]
pub struct CreateConfig<'info> {
    #[account(mut)]
    /// The admin account that will sign the transaction.
    pub admin: Signer<'info>,

    #[account(
        init,
        seeds = [constants::CONFIG_SEED],
        bump,
        payer = admin,
        space = Config::INIT_SPACE
    )]
    /// The configuration account to be created.
    pub config: Account<'info, Config>,

    /// The sol treasury account.
    pub sol_treasury: SystemAccount<'info>,

    /// The token treasury account.
    pub token_treasury: SystemAccount<'info>,

    /// The reward token mint account.
    #[account(
        init,
        payer = admin,
        mint::decimals = 9,
        mint::authority = governance_token_mint,
        seeds = [constants::GOVERNANCE_TOKEN_MINT_SEED],
        bump,
    )]
    pub governance_token_mint: InterfaceAccount<'info, Mint>,

    /// The token program account.
    pub token_program: Interface<'info, TokenInterface>,

    /// The associated token program account.
    pub associated_token_program: Program<'info, AssociatedToken>,

    /// The system program account.
    pub system_program: Program<'info, System>,
}

impl<'info> CreateConfig<'info> {
    /// Creates a new configuration.
    ///
    /// # Arguments
    ///
    /// * `sol_fee` - The fee value for the configuration.
    /// * `token_fee_basis_points` - The basis points of the token fee.
    /// * `governance_token_amount` - The amount of reward tokens to be minted.
    ///
    /// # Errors
    ///
    /// Returns an error if the configuration account is already initialized.
    pub fn create(
        &mut self,
        sol_fee: u64,
        token_fee_basis_points: u64,
        governance_token_amount: u64,
    ) -> Result<()> {
        // If the config account is already initialized, return an error.
        require!(
            self.config.admin == Pubkey::default(),
            ValhallaError::AlreadyInitialized
        );

        // If the basis points are greater than 10000, return an error.
        require!(
            token_fee_basis_points <= 10000,
            ValhallaError::InvalidTokenFeeBasisPoints
        );

        self.config.set_inner(Config {
            admin: self.admin.to_account_info().key(),
            sol_treasury: self.sol_treasury.to_account_info().key(),
            token_treasury: self.token_treasury.to_account_info().key(),
            governance_token_mint_key: self.governance_token_mint.to_account_info().key(),
            sol_fee,
            token_fee_basis_points,
            governance_token_amount,
        });

        Ok(())
    }
}
