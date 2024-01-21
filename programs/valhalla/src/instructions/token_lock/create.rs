use anchor_lang::{prelude::*, system_program};
use anchor_spl::{
    associated_token::AssociatedToken,
    token_2022::{self as token, TransferChecked},
    token_interface::{Mint, TokenAccount, TokenInterface},
};

use crate::{
    constants,
    errors::ValhallaError,
    state::{Config, TokenLock},
    VestingType,
};

#[derive(Accounts)]
/// Represents the instruction to create a new token_lock.
pub struct CreateTokenLock<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,

    #[account(seeds = [constants::CONFIG_SEED], bump, has_one = treasury)]
    pub config: Box<Account<'info, Config>>,

    #[account(mut, constraint = config.treasury == treasury.key())]
    /// The treasury where the fee will be sent too.
    /// CHECK: This account is only read from and stored as a Pubkey on the Config.
    pub treasury: AccountInfo<'info>,

    #[account(
        init,
        payer = creator,
        seeds = [
            creator.key().as_ref(),
            mint.key().as_ref(),
            constants::TOKEN_LOCK_SEED,
        ],
        space = TokenLock::size_of(),
        bump
    )]
    /// The token_lock PDA that will be created.
    pub token_lock: Box<Account<'info, TokenLock>>,

    #[account(
        init,
        seeds = [token_lock.key().as_ref(), constants::TOKEN_LOCK_TOKEN_ACCOUNT_SEED],
        bump,
        payer = creator,
        token::mint = mint,
        token::authority = token_lock_token_account,
        token::token_program = token_program
    )]
    /// The token account for the token_lock PDA
    pub token_lock_token_account: InterfaceAccount<'info, TokenAccount>,

    #[account(
        init_if_needed,
        payer = creator,
        associated_token::mint = mint,
        associated_token::authority = creator,
        associated_token::token_program = token_program
    )]
    /// The creator's token account.
    pub creator_token_account: InterfaceAccount<'info, TokenAccount>,

    /// The mint account for the tokens.
    pub mint: InterfaceAccount<'info, Mint>,

    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

pub fn create_token_lock_ix(
    ctx: Context<CreateTokenLock>,
    amount_to_be_vested: u64,
    total_vesting_duration: u64,
    name: [u8; 32],
) -> Result<()> {
    let token_lock = &mut ctx.accounts.token_lock;

    // Validate the amount to be vested
    // Get the user's token account balance and the amount to be vested amount
    let balance = ctx.accounts.creator_token_account.amount;
    let amount = amount_to_be_vested
        .checked_mul((10u64).pow(ctx.accounts.mint.decimals as u32))
        .unwrap();

    // Throw an error if the user doesn't have enough tokens in their account
    // for the amount to be vested amount
    if amount > balance {
        return Err(ValhallaError::InsufficientFundsForDeposit.into());
    }

    // Set the token_lock state
    token_lock.creator = ctx.accounts.creator.key();
    token_lock.mint = ctx.accounts.mint.key();
    token_lock.total_vesting_duration = total_vesting_duration;
    token_lock.name = name;
    token_lock.created_timestamp = Clock::get()?.unix_timestamp as u64;
    token_lock.vesting_type = VestingType::TokenLock;

    // Transfer the creator's tokens to the token_lock token account
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_accounts = TransferChecked {
        from: ctx.accounts.creator_token_account.to_account_info(),
        mint: ctx.accounts.mint.to_account_info(),
        to: ctx.accounts.token_lock_token_account.to_account_info(),
        authority: ctx.accounts.creator.to_account_info(),
    };
    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);

    token::transfer_checked(cpi_ctx, amount, ctx.accounts.mint.decimals)?;

    // Transfer the SOL fee from the creator to the treasury
    let cpi_program = ctx.accounts.system_program.to_account_info();
    let cpi_accounts = system_program::Transfer {
        from: ctx.accounts.creator.to_account_info(),
        to: ctx.accounts.treasury.to_account_info(),
    };
    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);

    system_program::transfer(cpi_ctx, ctx.accounts.config.fee)?;

    Ok(())
}
