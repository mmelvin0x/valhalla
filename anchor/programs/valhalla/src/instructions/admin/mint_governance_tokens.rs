use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{mint_to, Mint, MintTo, TokenAccount, TokenInterface},
};

use crate::{constants, Config};

#[derive(Accounts)]
pub struct MintGovernanceTokens<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(mut)]
    pub receiver: SystemAccount<'info>,

    #[account(
        mut,
        seeds = [constants::CONFIG_SEED],
        bump,
        has_one = admin,
    )]
    pub config: Account<'info, Config>,

    #[account(
        mut,
        mint::decimals = 9,
        mint::authority = governance_token_mint,
        seeds = [constants::GOVERNANCE_TOKEN_MINT_SEED],
        bump,
    )]
    pub governance_token_mint: InterfaceAccount<'info, Mint>,

    #[account(
        init_if_needed,
        payer = admin,
        associated_token::mint = governance_token_mint,
        associated_token::authority = receiver,
    )]
    pub receiver_token_account: InterfaceAccount<'info, TokenAccount>,

    pub token_program: Interface<'info, TokenInterface>,

    pub associated_token_program: Program<'info, AssociatedToken>,

    pub system_program: Program<'info, System>,
}

impl<'info> MintGovernanceTokens<'info> {
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
