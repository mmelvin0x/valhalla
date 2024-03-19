use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{Mint, TokenInterface},
};

use crate::{constants, errors::ValhallaError, state::Config};

#[derive(Accounts)]
pub struct CreateConfig<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(
        init,
        seeds = [constants::CONFIG_SEED],
        bump,
        payer = admin,
        space = Config::INIT_SPACE
    )]
    pub config: Account<'info, Config>,

    pub dev_treasury: SystemAccount<'info>,

    pub dao_treasury: SystemAccount<'info>,

    #[account(
        init,
        payer = admin,
        mint::decimals = 9,
        mint::authority = governance_token_mint,
        seeds = [constants::GOVERNANCE_TOKEN_MINT_SEED],
        bump,
    )]
    pub governance_token_mint: InterfaceAccount<'info, Mint>,

    pub token_program: Interface<'info, TokenInterface>,

    pub associated_token_program: Program<'info, AssociatedToken>,

    pub system_program: Program<'info, System>,
}

impl<'info> CreateConfig<'info> {
    pub fn create(
        &mut self,
        dev_fee: u64,
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
            dev_treasury: self.dev_treasury.to_account_info().key(),
            dao_treasury: self.dao_treasury.to_account_info().key(),
            governance_token_mint_key: self.governance_token_mint.to_account_info().key(),
            dev_fee,
            token_fee_basis_points,
            governance_token_amount,
        });

        // TODO: Create the metadata for the governance token.

        Ok(())
    }
}
