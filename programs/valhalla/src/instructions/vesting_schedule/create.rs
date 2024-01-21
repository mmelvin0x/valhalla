use anchor_lang::{prelude::*, system_program};
use anchor_spl::{
    associated_token::AssociatedToken,
    token_2022::{self as token, TransferChecked},
    token_interface::{Mint, TokenAccount, TokenInterface},
};

use crate::{
    constants,
    errors::ValhallaError,
    state::{Config, VestingSchedule},
    Authority, VestingType,
};

#[derive(Accounts)]
/// Represents the instruction to create a new vesting_schedule.
pub struct CreateVestingSchedule<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,

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
        payer = creator,
        seeds = [
            creator.key().as_ref(),
            recipient.key().as_ref(),
            mint.key().as_ref(),
            constants::VESTING_SCHEDULE_SEED,
        ],
        space = VestingSchedule::size_of(),
        bump
    )]
    /// The vesting_schedule PDA that will be created.
    pub vesting_schedule: Box<Account<'info, VestingSchedule>>,

    #[account(
        init,
        seeds = [vesting_schedule.key().as_ref(), constants::VESTING_SCHEDULE_TOKEN_ACCOUNT_SEED],
        bump,
        payer = creator,
        token::mint = mint,
        token::authority = vesting_schedule_token_account,
        token::token_program = token_program
    )]
    /// The token account for the vesting_schedule PDA
    pub vesting_schedule_token_account: InterfaceAccount<'info, TokenAccount>,

    #[account(
        init_if_needed,
        payer = creator,
        associated_token::mint = mint,
        associated_token::authority = creator,
        associated_token::token_program = token_program
    )]
    /// The creator's token account.
    pub creator_token_account: InterfaceAccount<'info, TokenAccount>,

    #[account(
        init_if_needed,
        payer = creator,
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

pub fn create_vesting_schedule_ix(
    ctx: Context<CreateVestingSchedule>,
    amount_to_be_vested: u64,
    total_vesting_duration: u64,
    payout_interval: u64,
    cliff_payment_amount: u64,
    start_date: u64,
    cancel_authority: Authority,
    change_recipient_authority: Authority,
    name: [u8; 32],
) -> Result<()> {
    let vesting_schedule = &mut ctx.accounts.vesting_schedule;
    let current_time = Clock::get()?.unix_timestamp as u64;

    // Validate the amount to be vested
    // Get the user's token account balance and the amount to be vested amount
    let balance = ctx.accounts.creator_token_account.amount;
    let mut amount = amount_to_be_vested
        .checked_mul((10u64).pow(ctx.accounts.mint.decimals as u32))
        .unwrap();

    // Throw an error if the user doesn't have enough tokens in their account
    // for the amount to be vested amount
    if amount > balance {
        return Err(ValhallaError::InsufficientFundsForDeposit.into());
    }

    // Throw an error if the total payment amount is greater than the amount to be vested amount.
    // This means the amount sent in the transaction and the payout intervals don't match up.
    let total_payouts = total_vesting_duration.checked_div(payout_interval).unwrap();
    let amount_per_payout = amount.checked_div(total_payouts).unwrap();
    let total_payout_amount = amount_per_payout.checked_mul(total_payouts).unwrap();
    if total_payout_amount > amount {
        return Err(ValhallaError::InsufficientFundsForDeposit.into());
    }

    // Validate cliff payment amount if there is one
    let mut cliff_payment = 0;
    if cliff_payment_amount > 0 {
        cliff_payment = cliff_payment_amount
            .checked_mul((10u64).pow(ctx.accounts.mint.decimals as u32))
            .unwrap();

        // Throw and error if the cliff payment amount plus amount to be vested amount
        // is greater than the number of tokens in the user's account
        if cliff_payment + amount > balance {
            return Err(ValhallaError::InsufficientFundsForDeposit.into());
        }
    }

    // Set the vesting_schedule state
    vesting_schedule.creator = ctx.accounts.creator.key();
    vesting_schedule.recipient = ctx.accounts.recipient.key();
    vesting_schedule.mint = ctx.accounts.mint.key();
    vesting_schedule.cancel_authority = cancel_authority;
    vesting_schedule.change_recipient_authority = change_recipient_authority;
    vesting_schedule.total_vesting_duration = total_vesting_duration;
    vesting_schedule.payout_interval = payout_interval;
    vesting_schedule.last_payment_timestamp = current_time;
    vesting_schedule.start_date = start_date;
    vesting_schedule.amount_per_payout = amount_per_payout;
    vesting_schedule.number_of_payments_made = 0;
    vesting_schedule.name = name;
    vesting_schedule.created_timestamp = current_time;
    vesting_schedule.vesting_type = VestingType::VestingSchedule;

    // Handle the case for a vesting_schedule starting on creation w/ a cliff payment
    if cliff_payment > 0 {
        // Send the cliff payment now if the start date is 0 (now)
        if start_date == 0 {
            let cpi_program = ctx.accounts.token_program.to_account_info();
            let cpi_accounts = TransferChecked {
                from: ctx.accounts.creator_token_account.to_account_info(),
                mint: ctx.accounts.mint.to_account_info(),
                to: ctx.accounts.recipient_token_account.to_account_info(),
                authority: ctx.accounts.creator.to_account_info(),
            };
            let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);

            token::transfer_checked(cpi_ctx, cliff_payment, ctx.accounts.mint.decimals)?;

            // Update the vesting_schedule state
            vesting_schedule.cliff_payment_amount = cliff_payment;
            vesting_schedule.is_cliff_payment_disbursed = true;
            vesting_schedule.start_date = current_time;
        } else {
            // Update the vesting_schedule state
            vesting_schedule.cliff_payment_amount = cliff_payment;

            // Add the cliff payment to the amount to be vested amount
            amount = amount.checked_add(cliff_payment).unwrap();
        }
    }

    // Transfer the creator's tokens to the vesting_schedule token account
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_accounts = TransferChecked {
        from: ctx.accounts.creator_token_account.to_account_info(),
        mint: ctx.accounts.mint.to_account_info(),
        to: ctx
            .accounts
            .vesting_schedule_token_account
            .to_account_info(),
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
