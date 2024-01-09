use anchor_lang::{ prelude::*, system_program };
use anchor_spl::{
    token_2022::{ self as token, TransferChecked },
    token_interface::{ TokenAccount, Mint, TokenInterface },
    associated_token::AssociatedToken,
};

use crate::{ state::{ Lock, Locker }, constants, errors::LockError };

#[derive(Accounts)]
pub struct CreateLock<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,

    /// CHECK: Used in constraints and stored on the Lock account
    pub beneficiary: AccountInfo<'info>,

    #[account(seeds = [constants::LOCKER_SEED], bump, has_one = treasury)]
    pub locker: Account<'info, Locker>,

    #[account(mut, constraint = locker.treasury == treasury.key())]
    /// CHECK: Only receives the fee
    pub treasury: AccountInfo<'info>,

    #[account(
        init,
        payer = creator,
        seeds = [creator.key().as_ref(), mint.key().as_ref(), constants::LOCK_SEED],
        space = 8 + std::mem::size_of::<Lock>(),
        bump
    )]
    pub lock: Box<Account<'info, Lock>>,

    #[account(
        init,
        seeds = [
            lock.key().as_ref(),
            creator.key().as_ref(),
            mint.key().as_ref(),
            constants::LOCK_TOKEN_ACCOUNT_SEED,
        ],
        bump,
        payer = creator,
        token::mint = mint,
        token::authority = lock_token_account,
        token::token_program = token_program
    )]
    pub lock_token_account: InterfaceAccount<'info, TokenAccount>,

    #[account(
        init_if_needed,
        payer = creator,
        associated_token::mint = mint,
        associated_token::authority = creator,
        associated_token::token_program = token_program
    )]
    pub creator_token_account: InterfaceAccount<'info, TokenAccount>,

    #[account(
        init_if_needed,
        payer = creator,
        associated_token::mint = mint,
        associated_token::authority = beneficiary,
        associated_token::token_program = token_program
    )]
    pub beneficiary_token_account: InterfaceAccount<'info, TokenAccount>,

    pub mint: Box<InterfaceAccount<'info, Mint>>,

    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

pub fn create_lock_ix(
    ctx: Context<CreateLock>,
    deposit_amount: u64,
    total_payments: u64,
    amount_per_payout: u64,
    payout_interval: u64
) -> Result<()> {
    let lock = &mut ctx.accounts.lock;

    // Set lock state
    lock.creator = ctx.accounts.creator.key();
    lock.beneficiary = ctx.accounts.beneficiary.key();
    lock.mint = ctx.accounts.mint.key();
    lock.lock_token_account = ctx.accounts.lock_token_account.to_account_info().key();
    lock.creator_token_account = ctx.accounts.creator_token_account.to_account_info().key();
    lock.beneficiary_token_account = ctx.accounts.beneficiary_token_account.to_account_info().key();
    lock.start_date = Clock::get().unwrap().unix_timestamp as u64;
    lock.total_payments = total_payments;
    lock.payout_interval = payout_interval;
    lock.num_payments_made = 0;
    lock.amount_per_payout = amount_per_payout
        .checked_mul((10u64).pow(ctx.accounts.mint.decimals as u32))
        .unwrap();

    // Prevent user from depositing more than they have
    let amount = deposit_amount
        .checked_mul((10u64).pow(ctx.accounts.mint.decimals as u32))
        .unwrap()
        .min(ctx.accounts.creator_token_account.amount);

    // Ensure that there are enough tokens being deposited to cover all of the payouts
    let total_amount_required_for_payouts = lock.amount_per_payout
        .checked_mul(lock.total_payments)
        .unwrap();
    if total_amount_required_for_payouts > amount {
        return Err(LockError::DepositAmountTooLow.into());
    }

    // Transfer the user's tokens to the lock token account
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_accounts = TransferChecked {
        from: ctx.accounts.creator_token_account.to_account_info(),
        mint: ctx.accounts.mint.to_account_info(),
        to: ctx.accounts.lock_token_account.to_account_info(),
        authority: ctx.accounts.creator.to_account_info(),
    };
    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);

    token::transfer_checked(cpi_ctx, amount, ctx.accounts.mint.decimals)?;

    // Transfer the SOL fee from the user to the admin
    let cpi_program = ctx.accounts.system_program.to_account_info();
    let cpi_accounts = system_program::Transfer {
        from: ctx.accounts.creator.to_account_info(),
        to: ctx.accounts.treasury.to_account_info(),
    };
    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);

    system_program::transfer(cpi_ctx, ctx.accounts.locker.fee)?;

    Ok(())
}
