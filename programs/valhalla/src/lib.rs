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

    // Admin

    pub fn admin_initialize(ctx: Context<AdminInitialize>, fee: u64) -> Result<()> {
        ctx.accounts.initialize(fee)
    }

    pub fn admin_update(ctx: Context<AdminUpdate>, new_fee: u64) -> Result<()> {
        ctx.accounts.update(new_fee)
    }

    // Create

    pub fn create_scheduled_payment(
        ctx: Context<CreateScheduledPayment>,
        identifier: u64,
        name: [u8; 32],
        amount_to_be_vested: u64,
        total_vesting_duration: u64,
        cancel_authority: Authority,
        change_recipient_authority: Authority,
    ) -> Result<()> {
        ctx.accounts.create(
            identifier,
            name,
            amount_to_be_vested,
            total_vesting_duration,
            cancel_authority,
            change_recipient_authority,
            ctx.bumps.vault_ata,
        )
    }

    pub fn create_token_lock(
        ctx: Context<CreateTokenLock>,
        identifier: u64,
        name: [u8; 32],
        amount_to_be_vested: u64,
        total_vesting_duration: u64,
    ) -> Result<()> {
        ctx.accounts.create(
            identifier,
            name,
            amount_to_be_vested,
            total_vesting_duration,
            ctx.bumps.vault_ata,
        )
    }

    pub fn create_vesting_schedule(
        ctx: Context<CreateVestingSchedule>,
        identifier: u64,
        name: [u8; 32],
        amount_to_be_vested: u64,
        total_vesting_duration: u64,
        cancel_authority: Authority,
        change_recipient_authority: Authority,
        payout_interval: u64,
        cliff_payment_amount: u64,
        start_date: u64,
    ) -> Result<()> {
        ctx.accounts.create(
            identifier,
            name,
            amount_to_be_vested,
            total_vesting_duration,
            cancel_authority,
            change_recipient_authority,
            payout_interval,
            cliff_payment_amount,
            start_date,
            ctx.bumps.vault_ata,
        )
    }

    // Disburse

    pub fn disburse_scheduled_payment(ctx: Context<DisburseScheduledPayment>) -> Result<()> {
        ctx.accounts.disburse()
    }

    pub fn disburse_token_lock(ctx: Context<DisburseTokenLock>) -> Result<()> {
        ctx.accounts.disburse()
    }

    pub fn disburse_vesting_schedule(ctx: Context<DisburseVestingSchedule>) -> Result<()> {
        ctx.accounts.disburse()
    }

    // Close

    pub fn close_scheduled_payment(ctx: Context<CloseScheduledPayment>) -> Result<()> {
        ctx.accounts.close()
    }

    pub fn close_token_lock(ctx: Context<CloseTokenLock>) -> Result<()> {
        ctx.accounts.close()
    }

    pub fn close_vesting_schedule(ctx: Context<CloseVestingSchedule>) -> Result<()> {
        ctx.accounts.close()
    }

    // Update

    pub fn update_scheduled_payment(ctx: Context<UpdateScheduledPayment>) -> Result<()> {
        ctx.accounts.update()
    }

    pub fn update_vesting_schedule(ctx: Context<UpdateVestingSchedule>) -> Result<()> {
        ctx.accounts.update()
    }

    // Cancel

    pub fn cancel_scheduled_payment(ctx: Context<CancelScheduledPayment>) -> Result<()> {
        ctx.accounts.cancel()
    }

    pub fn cancel_vesting_schedule(ctx: Context<CancelVestingSchedule>) -> Result<()> {
        ctx.accounts.cancel()
    }
}
