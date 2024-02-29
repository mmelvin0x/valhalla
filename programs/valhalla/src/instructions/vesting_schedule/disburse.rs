use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_2022::{self as token},
    token_interface::{CloseAccount, Mint, Token2022, TokenAccount, TransferChecked},
};

use crate::{constants, errors::ValhallaError, state::VestingSchedule};

#[derive(Accounts)]
pub struct DisburseVestingSchedule<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    /// CHECK: Used for seeds
    pub creator: UncheckedAccount<'info>,

    /// CHECK: Used in constraints
    pub recipient: UncheckedAccount<'info>,

    #[account(
        mut,
        seeds = [
            creator.key().as_ref(),
            recipient.key().as_ref(),
            mint.key().as_ref(),
            constants::VESTING_SCHEDULE_SEED
        ],
        bump,
        has_one = mint,
        has_one = creator,
        has_one = recipient
    )]
    pub vesting_schedule: Account<'info, VestingSchedule>,

    #[account(
        mut,
        seeds = [vesting_schedule.key().as_ref(), constants::VESTING_SCHEDULE_TOKEN_ACCOUNT_SEED],
        bump,
        token::mint = mint,
        token::authority = vesting_schedule_token_account,
    )]
    pub vesting_schedule_token_account: InterfaceAccount<'info, TokenAccount>,

    #[account(
        init_if_needed,
        payer = signer,
        associated_token::mint = mint,
        associated_token::authority = recipient
    )]
    pub recipient_token_account: InterfaceAccount<'info, TokenAccount>,

    pub mint: InterfaceAccount<'info, Mint>,

    pub token_program: Program<'info, Token2022>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

pub fn disburse_vesting_schedule_ix(ctx: Context<DisburseVestingSchedule>) -> Result<()> {
    let vesting_schedule = &mut ctx.accounts.vesting_schedule;

    let mut transfer_amount: u64 = 0;
    let mut num_payments_owed: u64 = 0;
    let current_time = Clock::get()?.unix_timestamp as u64;

    if vesting_schedule.start_date <= current_time {
        num_payments_owed += 1;

        // If the vesting_schedule has a payout interval, we need to check how many payments are owed and
        // add them to the transfer amount
        let time_since_start = current_time
            .checked_sub(vesting_schedule.start_date)
            .unwrap();
        let num_payments_possible_since_start = time_since_start
            .checked_div(vesting_schedule.payout_interval)
            .unwrap();

        // The number of payments owed is the number of payments possible since the start of the
        // vesting_schedule minus the number of payments already made
        num_payments_owed = num_payments_owed
            + num_payments_possible_since_start
                .checked_sub(vesting_schedule.number_of_payments_made)
                .unwrap();

        // Add the amount per payout multiplied by the number of payments owed to the recipient
        transfer_amount = transfer_amount
            .checked_add(
                vesting_schedule
                    .amount_per_payout
                    .checked_mul(num_payments_owed)
                    .unwrap(),
            )
            .unwrap();

        // Update the number of payments made
        vesting_schedule.number_of_payments_made = vesting_schedule
            .number_of_payments_made
            .checked_add(num_payments_owed)
            .unwrap();

        // If the vesting_schedule has a cliff payment, we need to check if it has been disbursed and if not,
        // add it to the transfer amount and mark it as disbursed
        if vesting_schedule.cliff_payment_amount > 0 && !vesting_schedule.is_cliff_payment_disbursed
        {
            transfer_amount = transfer_amount
                .checked_add(vesting_schedule.cliff_payment_amount)
                .unwrap();
            vesting_schedule.is_cliff_payment_disbursed = true;
        }

        // If the vesting end date is reached, release all of the tokens
        if vesting_schedule
            .start_date
            .checked_add(vesting_schedule.total_vesting_duration)
            .unwrap_or_default()
            <= current_time
        {
            // Set the transfer amount to the amount in the vesting_schedule token account
            transfer_amount = ctx.accounts.vesting_schedule_token_account.amount;

            // Set the number of payments made to the total number of payments possible
            vesting_schedule.number_of_payments_made = vesting_schedule
                .total_vesting_duration
                .checked_div(vesting_schedule.payout_interval)
                .unwrap_or_default();
        }
    } else {
        return Err(ValhallaError::Locked.into());
    }

    if transfer_amount > 0 {
        // If this is a transfer fee token, the last payment will be less than the amount per payout,
        // so we need to check if the vesting_schedule token account has enough to cover the transfer amount
        // and if not, set the transfer amount to the vesting_schedule token account's balance
        if transfer_amount > ctx.accounts.vesting_schedule_token_account.amount {
            transfer_amount = ctx.accounts.vesting_schedule_token_account.amount;
        }

        let lock_key = vesting_schedule.key();
        let bump = ctx.bumps.vesting_schedule_token_account;
        let signer_seeds: &[&[&[u8]]] = &[&[
            lock_key.as_ref(),
            constants::VESTING_SCHEDULE_TOKEN_ACCOUNT_SEED,
            &[bump],
        ]];
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_accounts = TransferChecked {
            from: ctx
                .accounts
                .vesting_schedule_token_account
                .to_account_info(),
            mint: ctx.accounts.mint.to_account_info(),
            to: ctx.accounts.recipient_token_account.to_account_info(),
            authority: ctx
                .accounts
                .vesting_schedule_token_account
                .to_account_info(),
        };
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer_seeds);

        token::transfer_checked(cpi_ctx, transfer_amount, ctx.accounts.mint.decimals)?;
    } else {
        return Err(ValhallaError::NoPayout.into());
    }

    // Close the accounts if the vesting_schedule is complete
    if ctx.accounts.vesting_schedule_token_account.amount == 0 {
        // Close the vesting_schedule token account
        let lock_key = vesting_schedule.key();
        let bump = ctx.bumps.vesting_schedule_token_account;
        let signer_seeds: &[&[&[u8]]] = &[&[
            lock_key.as_ref(),
            constants::VESTING_SCHEDULE_TOKEN_ACCOUNT_SEED,
            &[bump],
        ]];
        let cpi_accounts = CloseAccount {
            account: ctx
                .accounts
                .vesting_schedule_token_account
                .to_account_info(),
            destination: ctx.accounts.creator.to_account_info(),
            authority: ctx
                .accounts
                .vesting_schedule_token_account
                .to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer_seeds);

        token::close_account(cpi_ctx)?;

        // Close the PDA
        let lamps = **ctx
            .accounts
            .vesting_schedule
            .to_account_info()
            .try_borrow_mut_lamports()?;
        **ctx
            .accounts
            .vesting_schedule
            .to_account_info()
            .try_borrow_mut_lamports()? -= lamps;
        **ctx
            .accounts
            .creator
            .to_account_info()
            .try_borrow_mut_lamports()? += lamps;
    }

    Ok(())
}
