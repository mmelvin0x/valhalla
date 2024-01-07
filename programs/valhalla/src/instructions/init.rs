use anchor_lang::prelude::*;
use anchor_spl::{
    token::{ Mint, Token, MintTo, self, TokenAccount },
    associated_token::AssociatedToken,
};
use mpl_token_metadata::{
    instruction::create_metadata_accounts_v3,
    pda::find_metadata_account,
    ID as MetadataID,
};
use solana_program::program::invoke_signed;

use crate::{ constants, state::Locker };

#[derive(Clone)]
pub struct TokenMetaData;
impl anchor_lang::Id for TokenMetaData {
    fn id() -> Pubkey {
        MetadataID
    }
}

#[derive(Accounts)]
pub struct Init<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(init, seeds = [constants::LOCKER_SEED], bump, payer = admin, space = Locker::LEN)]
    pub locker: Account<'info, Locker>,

    #[account(
        init,
        seeds = [constants::REWARD_TOKEN_MINT_SEED],
        bump,
        payer = admin,
        mint::decimals = 9,
        mint::authority = reward_token_mint
    )]
    pub reward_token_mint: Account<'info, Mint>,

    /// CHECK: Using address constraints to ensure the correct account is used
    #[account(mut, address = find_metadata_account(&reward_token_mint.key()).0)]
    pub metadata: UncheckedAccount<'info>,

    #[account(
        init_if_needed,
        payer = admin,
        associated_token::mint = reward_token_mint,
        associated_token::authority = treasury
    )]
    pub treasury_reward_token_account: Account<'info, TokenAccount>,

    /// CHECK: Only read from and stored as a Pubkey on the Locker
    pub treasury: AccountInfo<'info>,

    pub token_program: Program<'info, Token>,
    pub token_metadata_program: Program<'info, TokenMetaData>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn init(
    ctx: Context<Init>,
    fee: u64,
    treasury_allocation: u64,
    uri: String,
    name: String,
    symbol: String
) -> Result<()> {
    let locker = &mut ctx.accounts.locker;

    // Setup the Locker
    locker.admin = ctx.accounts.admin.key();
    locker.treasury = ctx.accounts.treasury.key();
    locker.reward_token_mint = ctx.accounts.reward_token_mint.key();
    locker.fee = fee;

    // Get the signer needed for the mint and metadata creation
    let bump = ctx.bumps.reward_token_mint;
    let seeds = &[constants::REWARD_TOKEN_MINT_SEED, &[bump]];
    let signer = &[&seeds[..]];

    // Create the metadata account
    invoke_signed(
        &create_metadata_accounts_v3(
            ctx.accounts.token_metadata_program.key(),
            ctx.accounts.metadata.key(),
            ctx.accounts.reward_token_mint.key(),
            ctx.accounts.reward_token_mint.key(),
            ctx.accounts.admin.key(),
            ctx.accounts.reward_token_mint.key(),
            name,
            symbol,
            uri,
            None,
            0,
            true,
            true,
            None,
            None,
            None
        ),
        &[
            ctx.accounts.metadata.to_account_info(),
            ctx.accounts.reward_token_mint.to_account_info(),
            ctx.accounts.reward_token_mint.to_account_info(),
            ctx.accounts.admin.to_account_info(),
            ctx.accounts.reward_token_mint.to_account_info(),
            ctx.accounts.token_metadata_program.to_account_info(),
            ctx.accounts.rent.to_account_info(),
        ],
        signer
    )?;

    // Mint initial tokens to the treasury
    let amount = treasury_allocation
        .checked_mul((10u64).pow(ctx.accounts.reward_token_mint.decimals as u32))
        .unwrap();
    let cpi_program = ctx.accounts.token_program.to_account_info().clone();
    let cpi_accounts = MintTo {
        mint: ctx.accounts.reward_token_mint.to_account_info(),
        to: ctx.accounts.treasury_reward_token_account.to_account_info(),
        authority: ctx.accounts.reward_token_mint.to_account_info(),
    };
    let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);

    token::mint_to(cpi_ctx, amount)?;

    Ok(())
}
