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
        instructions::admin_initialize_ix(ctx, fee)
    }

    pub fn admin_update(ctx: Context<AdminUpdate>, new_fee: u64) -> Result<()> {
        instructions::admin_update_ix(ctx, new_fee)
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
        instructions::create_vesting_schedule_ix(
            ctx,
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
        instructions::disburse_vesting_schedule_ix(ctx)
    }

    pub fn cancel_vesting_schedule(ctx: Context<CancelVestingSchedule>) -> Result<()> {
        instructions::cancel_vesting_schedule_ix(ctx)
    }

    pub fn update_vesting_schedule(ctx: Context<UpdateVestingSchedule>) -> Result<()> {
        instructions::update_vesting_schedule_ix(ctx)
    }

    pub fn create_token_lock(
        ctx: Context<CreateTokenLock>,
        amount_to_be_vested: u64,
        total_vesting_duration: u64,
        name: [u8; 32],
    ) -> Result<()> {
        instructions::create_token_lock_ix(ctx, amount_to_be_vested, total_vesting_duration, name)
    }

    pub fn disburse_token_lock(ctx: Context<DisburseTokenLock>) -> Result<()> {
        instructions::disburse_token_lock_ix(ctx)
    }

    pub fn create_scheduled_payment(
        ctx: Context<CreateScheduledPayment>,
        amount_to_be_vested: u64,
        total_vesting_duration: u64,
        cancel_authority: Authority,
        change_recipient_authority: Authority,
        name: [u8; 32],
    ) -> Result<()> {
        instructions::create_scheduled_payment_ix(
            ctx,
            amount_to_be_vested,
            total_vesting_duration,
            cancel_authority,
            change_recipient_authority,
            name,
        )
    }

    pub fn disburse_scheduled_payment(ctx: Context<DisburseScheduledPayment>) -> Result<()> {
        instructions::disburse_scheduled_payment_ix(ctx)
    }

    pub fn cancel_scheduled_payment(ctx: Context<CancelScheduledPayment>) -> Result<()> {
        instructions::cancel_scheduled_payment_ix(ctx)
    }

    pub fn update_scheduled_payment(ctx: Context<UpdateScheduledPayment>) -> Result<()> {
        instructions::update_scheduled_payment_ix(ctx)
    }
}
