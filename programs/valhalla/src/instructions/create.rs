use anchor_lang::{ prelude::*, system_program };
use anchor_spl::{
    token_2022::{ self as token, TransferChecked },
    token_interface::{ TokenAccount, Mint, TokenInterface },
    associated_token::AssociatedToken,
};

use crate::{ state::{ Lock, Locker }, constants, Authority };

#[derive(Accounts)]
/// Represents the instruction to create a new lock.
pub struct Create<'info> {
    #[account(mut)]
    pub funder: Signer<'info>,

    /// The account of the beneficiary who will receive the locked tokens.
    /// CHECK: This account is only read from and stored as a Pubkey on the Locker.
    pub beneficiary: AccountInfo<'info>,

    #[account(seeds = [constants::LOCKER_SEED], bump, has_one = treasury)]
    pub locker: Box<Account<'info, Locker>>,

    #[account(mut, constraint = locker.treasury == treasury.key())]
    /// The treasury where the fee will be sent too.
    /// CHECK: This account is only read from and stored as a Pubkey on the Locker.
    pub treasury: AccountInfo<'info>,

    #[account(
        init,
        payer = funder,
        seeds = [funder.key().as_ref(), mint.key().as_ref(), constants::LOCK_SEED],
        space = Lock::size_of(),
        bump
    )]
    /// The lock PDA that will be created.
    pub lock: Box<Account<'info, Lock>>,

    #[account(
        init,
        seeds = [
            lock.key().as_ref(),
            funder.key().as_ref(),
            mint.key().as_ref(),
            constants::LOCK_TOKEN_ACCOUNT_SEED,
        ],
        bump,
        payer = funder,
        token::mint = mint,
        token::authority = lock_token_account,
        token::token_program = token_program
    )]
    /// The token account for the lock PDA
    pub lock_token_account: InterfaceAccount<'info, TokenAccount>,

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
        associated_token::authority = beneficiary,
        associated_token::token_program = token_program
    )]
    /// The beneficiary's token account.
    pub beneficiary_token_account: InterfaceAccount<'info, TokenAccount>,

    /// The mint account for the tokens.
    pub mint: InterfaceAccount<'info, Mint>,

    /// The program that provides the token-related functionality.
    pub token_program: Interface<'info, TokenInterface>,

    /// The program that provides the associated token functionality.
    pub associated_token_program: Program<'info, AssociatedToken>,

    /// The system program.
    pub system_program: Program<'info, System>,
}

/// Creates a new lock by transferring tokens from the funder's account to the lock token account,
/// setting the lock's state, and transferring the SOL fee to the treasury account.
///
/// # Arguments
///
/// * `ctx` - The context of the create instruction.
/// * `amount_to_be_vested` - The total amount of tokens to be vested.
/// * `vesting_duration` - The duration of the vesting period in seconds.
/// * `payout_interval` - The interval at which payouts will be made in seconds.
/// * `cliff_payment_amount` - The amount of tokens to be paid out immediately at the cliff.
/// * `cancel_authority` - The authority that can cancel the lock.
/// * `change_recipient_authority` - The authority that can change the recipient of the lock.
///
/// # Errors
///
/// This function will return an error if the deposit amount is invalid or if any of the token transfers fail.
pub fn create_ix(
    ctx: Context<Create>,
    amount_to_be_vested: u64,
    vesting_duration: u64,
    payout_interval: u64,
    cliff_payment_amount: u64,
    start_date: u64,
    cancel_authority: Authority,
    change_recipient_authority: Authority
) -> Result<()> {
    let lock = &mut ctx.accounts.lock;

    // Prevent from depositing more than they have
    let (amount, amount_per_payout) = Lock::validate_deposit_amount(
        vesting_duration,
        payout_interval,
        amount_to_be_vested,
        cliff_payment_amount,
        ctx.accounts.funder_token_account.amount,
        ctx.accounts.mint.decimals as u32
    )?;

    lock.funder = ctx.accounts.funder.key();
    lock.beneficiary = ctx.accounts.beneficiary.key();
    lock.mint = ctx.accounts.mint.key();
    lock.cancel_authority = cancel_authority;
    lock.change_recipient_authority = change_recipient_authority;
    lock.vesting_duration = vesting_duration;
    lock.payout_interval = payout_interval;
    lock.amount_per_payout = amount_per_payout;
    lock.cliff_payment_amount = cliff_payment_amount;
    lock.num_payments_made = 0;

    // Transfer the funder's tokens to the lock token account
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_accounts = TransferChecked {
        from: ctx.accounts.funder_token_account.to_account_info(),
        mint: ctx.accounts.mint.to_account_info(),
        to: ctx.accounts.lock_token_account.to_account_info(),
        authority: ctx.accounts.funder.to_account_info(),
    };
    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);

    token::transfer_checked(cpi_ctx, amount, ctx.accounts.mint.decimals)?;

    // Transfer the cliff amount to the beneficiary if there is one and the start date is 0 (now)
    if lock.cliff_payment_amount > 0 && start_date == 0 {
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_accounts = TransferChecked {
            from: ctx.accounts.funder_token_account.to_account_info(),
            mint: ctx.accounts.mint.to_account_info(),
            to: ctx.accounts.beneficiary_token_account.to_account_info(),
            authority: ctx.accounts.funder.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);

        token::transfer_checked(cpi_ctx, cliff_payment_amount, ctx.accounts.mint.decimals)?;
    }

    // Set the start date. We do this bc if the start date is 0, we want to set it to the current time
    // after we've transferred the cliff payment amount to the beneficiary (if there was one)
    lock.start_date = if start_date == 0 {
        Clock::get()?.unix_timestamp as u64
    } else {
        start_date
    };

    // Transfer the SOL fee from the funder to the admin
    let cpi_program = ctx.accounts.system_program.to_account_info();
    let cpi_accounts = system_program::Transfer {
        from: ctx.accounts.funder.to_account_info(),
        to: ctx.accounts.treasury.to_account_info(),
    };
    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);

    system_program::transfer(cpi_ctx, ctx.accounts.locker.fee)?;

    Ok(())
}
