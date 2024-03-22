use anchor_lang::{prelude::*, solana_program::sysvar::instructions::ID as INSTRUCTIONS_ID};
use anchor_spl::{
    associated_token::AssociatedToken,
    metadata::{
        mpl_token_metadata::{instructions::CreateV1CpiBuilder, types::TokenStandard},
        Metadata,
    },
    token_interface::{Mint, TokenInterface},
};

use crate::{constants, errors::ValhallaError, state::Config};

#[derive(Accounts)]
#[instruction(
    name: String,
    symbol: String,
    uri: String,
    decimals: u8,
    dev_fee: u64,
    token_fee_basis_points: u64,
    governance_token_amount: u64
)]
pub struct CreateConfig<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(mut)]
    /// CHECK: no need to check it out
    pub metadata: UncheckedAccount<'info>,

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
        mint::decimals = decimals,
        mint::authority = governance_token_mint,
        seeds = [constants::GOVERNANCE_TOKEN_MINT_SEED],
        bump,
    )]
    pub governance_token_mint: InterfaceAccount<'info, Mint>,

    pub token_metadata_program: Program<'info, Metadata>,

    pub token_program: Interface<'info, TokenInterface>,

    pub associated_token_program: Program<'info, AssociatedToken>,

    pub system_program: Program<'info, System>,

    #[account(address = INSTRUCTIONS_ID)]
    /// CHECK: no need to check it out
    pub sysvar_instruction: AccountInfo<'info>,
}

impl<'info> CreateConfig<'info> {
    pub fn create(
        &mut self,
        name: String,
        symbol: String,
        uri: String,
        decimals: u8,
        dev_fee: u64,
        autopay_multiplier: u64,
        token_fee_basis_points: u64,
        governance_token_amount: u64,
        bumps: &CreateConfigBumps,
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
            autopay_multiplier,
            token_fee_basis_points,
            governance_token_amount,
        });

        let seeds = &[
            constants::GOVERNANCE_TOKEN_MINT_SEED,
            &[bumps.governance_token_mint],
        ];
        let signer_seeds = &[&seeds[..]];

        CreateV1CpiBuilder::new(&self.token_metadata_program)
            .metadata(&self.metadata.to_account_info())
            .mint(&self.governance_token_mint.to_account_info(), false)
            .authority(&self.governance_token_mint.to_account_info())
            .payer(&self.admin.to_account_info())
            .update_authority(&self.governance_token_mint.to_account_info(), false)
            .system_program(&self.system_program.to_account_info())
            .sysvar_instructions(&self.sysvar_instruction.to_account_info())
            .spl_token_program(&self.token_program.to_account_info())
            .name(name)
            .symbol(symbol)
            .uri(uri)
            .decimals(decimals)
            .seller_fee_basis_points(0)
            .token_standard(TokenStandard::Fungible)
            .invoke_signed(signer_seeds)?;

        // TODO: Mint initial allocations of governance tokens to the DAO treasury and development team treasury.

        Ok(())
    }
}
