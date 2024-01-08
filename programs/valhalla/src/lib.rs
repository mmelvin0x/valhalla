use anchor_lang::prelude::*;

mod id;
mod constants;
mod errors;
mod instructions;
mod state;

pub use instructions::*;
pub use state::*;

pub use id::ID;

#[program]
pub mod valhalla {
    use super::*;

    pub fn admin_init_locker(ctx: Context<InitLocker>, fee: u64) -> Result<()> {
        instructions::init_locker_ix(ctx, fee)
    }

    pub fn admin_update_locker_fee(ctx: Context<UpdateLockerFee>, fee: u64) -> Result<()> {
        instructions::update_locker_fee_ix(ctx, fee)
    }

    pub fn create_lock(
        ctx: Context<CreateLock>,
        deposit_amount: u64,
        total_payments: u64,
        amount_per_payout: u64,
        payout_interval: u64
    ) -> Result<()> {
        instructions::create_lock_ix(
            ctx,
            deposit_amount,
            total_payments,
            amount_per_payout,
            payout_interval
        )
    }

    pub fn increase_num_payouts(
        ctx: Context<ExtendSchedule>,
        total_payments_increase_amount: u64
    ) -> Result<()> {
        instructions::increase_num_payouts_ix(ctx, total_payments_increase_amount)
    }

    pub fn disburse_to_beneficiary(ctx: Context<DisburseToBeneficiary>) -> Result<()> {
        instructions::disburse_to_beneficiary_ix(ctx)
    }

    pub fn close_lock_(ctx: Context<CloseLock>) -> Result<()> {
        instructions::close_lock_ix(ctx)
    }
}
