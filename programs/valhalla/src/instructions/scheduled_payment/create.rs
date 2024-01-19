use anchor_lang::{prelude::*, system_program};
use anchor_spl::{
    associated_token::AssociatedToken,
    token_2022::{self as token, TransferChecked},
    token_interface::{Mint, TokenAccount, TokenInterface},
};

use crate::{
    constants,
    errors::ValhallaError,
    state::{Config, ScheduledPayment},
    Authority,
};

#[derive(Accounts)]
/// Represents the instruction to create a new scheduled_payment.
pub struct CreateScheduledPayment<'info> {
    #[account(mut)]
    pub funder: Signer<'info>,

    /// The account of the recipient who will receive the locked tokens.
    /// CHECK: This account is only read from and stored as a Pubkey on the Config.
    pub recipient: AccountInfo<'info>,

    #[account(seeds = [constants::CONFIG_SEED], bump, has_one = treasury)]
    pub config: Box<Account<'info, Config>>,

    #[account(mut, constraint = config.treasury == treasury.key())]
    /// The treasury where the fee will be sent too.
    /// CHECK: This account is only read from and stored as a Pubkey on the Config.
    pub treasury: AccountInfo<'info>,

    #[account(
        init,
        payer = funder,
        seeds = [
            funder.key().as_ref(),
            recipient.key().as_ref(),
            mint.key().as_ref(),
            constants::SCHEDULED_PAYMENT_SEED,
        ],
        space = ScheduledPayment::size_of(),
        bump
    )]
    /// The scheduled_payment PDA that will be created.
    pub scheduled_payment: Box<Account<'info, ScheduledPayment>>,

    #[account(
        init,
        seeds = [scheduled_payment.key().as_ref(), constants::SCHEDULED_PAYMENT_TOKEN_ACCOUNT_SEED],
        bump,
        payer = funder,
        token::mint = mint,
        token::authority = payment_token_account,
        token::token_program = token_program
    )]
    /// The token account for the scheduled_payment PDA
    pub payment_token_account: InterfaceAccount<'info, TokenAccount>,

    #[account(
        init_if_needed,
        payer = funder,
        associated_token::mint = mint,
        associated_token::authority = funder,
        associated_token::token_program = token_program
    )]
    /// The funder's token account.
    pub funder_token_account: InterfaceAccount<'info, TokenAccount>,

    #[account(
        init_if_needed,
        payer = funder,
        associated_token::mint = mint,
        associated_token::authority = recipient,
        associated_token::token_program = token_program
    )]
    /// The recipient's token account.
    pub recipient_token_account: InterfaceAccount<'info, TokenAccount>,

    /// The mint account for the tokens.
    pub mint: InterfaceAccount<'info, Mint>,

    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

pub fn create_scheduled_payment_ix(
    ctx: Context<CreateScheduledPayment>,
    amount_to_be_vested: u64,
    total_vesting_duration: u64,
    cancel_authority: Authority,
    change_recipient_authority: Authority,
    name: [u8; 32],
) -> Result<()> {
    let scheduled_payment = &mut ctx.accounts.scheduled_payment;

    // Validate the amount to be vested
    // Get the user's token account balance and the amount to be vested amount
    let balance = ctx.accounts.funder_token_account.amount;
    let amount = amount_to_be_vested
        .checked_mul((10u64).pow(ctx.accounts.mint.decimals as u32))
        .unwrap();

    // Throw an error if the user doesn't have enough tokens in their account
    // for the amount to be vested amount
    if amount > balance {
        return Err(ValhallaError::InsufficientFundsForDeposit.into());
    }

    // Set the scheduled_payment state
    scheduled_payment.funder = ctx.accounts.funder.key();
    scheduled_payment.recipient = ctx.accounts.recipient.key();
    scheduled_payment.mint = ctx.accounts.mint.key();
    scheduled_payment.total_vesting_duration = total_vesting_duration;
    scheduled_payment.name = name;
    scheduled_payment.created_timestamp = Clock::get()?.unix_timestamp as u64;
    scheduled_payment.cancel_authority = cancel_authority;
    scheduled_payment.change_recipient_authority = change_recipient_authority;

    // Transfer the funder's tokens to the scheduled_payment token account
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_accounts = TransferChecked {
        from: ctx.accounts.funder_token_account.to_account_info(),
        mint: ctx.accounts.mint.to_account_info(),
        to: ctx.accounts.payment_token_account.to_account_info(),
        authority: ctx.accounts.funder.to_account_info(),
    };
    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);

    token::transfer_checked(cpi_ctx, amount, ctx.accounts.mint.decimals)?;

    // Transfer the SOL fee from the funder to the treasury
    let cpi_program = ctx.accounts.system_program.to_account_info();
    let cpi_accounts = system_program::Transfer {
        from: ctx.accounts.funder.to_account_info(),
        to: ctx.accounts.treasury.to_account_info(),
    };
    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);

    system_program::transfer(cpi_ctx, ctx.accounts.config.fee)?;

    Ok(())
}
