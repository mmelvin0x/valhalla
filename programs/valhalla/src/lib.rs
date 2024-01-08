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
        schedule: Vec<Schedule>
    ) -> Result<()> {
        instructions::create_lock_ix(ctx, deposit_amount, schedule)
    }

    pub fn deposit_to_lock(ctx: Context<DepositToLock>, deposit_amount: u64) -> Result<()> {
        instructions::deposit_to_lock_ix(ctx, deposit_amount)
    }

    pub fn extend_schedule(
        ctx: Context<ExtendSchedule>,
        schedule: Vec<Schedule>,
        amount: u64
    ) -> Result<()> {
        instructions::extend_schedule_ix(ctx, schedule, amount)
    }

    pub fn disperse_to_beneficiary(ctx: Context<WithdrawToBeneficiary>) -> Result<()> {
        instructions::disperse_to_beneficiary_ix(ctx)
    }

    pub fn close_lock_(ctx: Context<CloseLock>) -> Result<()> {
        instructions::close_lock_ix(ctx)
    }
}
