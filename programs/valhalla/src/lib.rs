use anchor_lang::prelude::*;

mod constants;
mod errors;
mod id;
mod instructions;
mod state;
mod types;

pub use instructions::*;
pub use state::*;
pub use types::*;

pub use id::ID;

#[program]
pub mod valhalla {
    use super::*;

    pub fn admin_initialize(ctx: Context<AdminInitialize>, fee: u64) -> Result<()> {
        ctx.accounts.initialize(fee)
    }

    pub fn admin_update(ctx: Context<AdminUpdate>, new_fee: u64) -> Result<()> {
        ctx.accounts.update(new_fee)
    }

    pub fn create_vesting_schedule(
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
        ctx.accounts.create(
            amount_to_be_vested,
            total_vesting_duration,
            payout_interval,
            cliff_payment_amount,
            start_date,
            cancel_authority,
            change_recipient_authority,
            name,
        )
    }

    pub fn disburse_vesting_schedule(ctx: Context<DisburseVestingSchedule>) -> Result<()> {
        ctx.accounts
            .disburse(ctx.bumps.vesting_schedule_token_account)
    }

    pub fn cancel_vesting_schedule(ctx: Context<CancelVestingSchedule>) -> Result<()> {
        ctx.accounts
            .cancel(ctx.bumps.vesting_schedule_token_account)
    }

    pub fn close_vesting_schedule(ctx: Context<CloseVestingSchedule>) -> Result<()> {
        ctx.accounts.close(ctx.bumps.vesting_schedule_token_account)
    }

    pub fn update_vesting_schedule(ctx: Context<UpdateVestingSchedule>) -> Result<()> {
        ctx.accounts.update()
    }

    pub fn create_token_lock(
        ctx: Context<CreateTokenLock>,
        amount_to_be_vested: u64,
        total_vesting_duration: u64,
        name: [u8; 32],
    ) -> Result<()> {
        ctx.accounts
            .create(amount_to_be_vested, total_vesting_duration, name)
    }

    pub fn disburse_token_lock(ctx: Context<DisburseTokenLock>) -> Result<()> {
        ctx.accounts.disburse(ctx.bumps.token_lock_token_account)
    }

    pub fn close_token_lock(ctx: Context<CloseTokenLock>) -> Result<()> {
        ctx.accounts.close(ctx.bumps.token_lock_token_account)
    }

    pub fn create_scheduled_payment(
        ctx: Context<CreateScheduledPayment>,
        amount_to_be_vested: u64,
        total_vesting_duration: u64,
        cancel_authority: Authority,
        change_recipient_authority: Authority,
        name: [u8; 32],
    ) -> Result<()> {
        ctx.accounts.create(
            amount_to_be_vested,
            total_vesting_duration,
            cancel_authority,
            change_recipient_authority,
            name,
        )
    }

    pub fn disburse_scheduled_payment(ctx: Context<DisburseScheduledPayment>) -> Result<()> {
        ctx.accounts.disburse(ctx.bumps.payment_token_account)
    }

    pub fn cancel_scheduled_payment(ctx: Context<CancelScheduledPayment>) -> Result<()> {
        ctx.accounts.cancel(ctx.bumps.payment_token_account)
    }

    pub fn update_scheduled_payment(ctx: Context<UpdateScheduledPayment>) -> Result<()> {
        ctx.accounts.update()
    }

    pub fn close_scheduled_payment(ctx: Context<CloseScheduledPayment>) -> Result<()> {
        ctx.accounts.close(ctx.bumps.payment_token_account)
    }
}
