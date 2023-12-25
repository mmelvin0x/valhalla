use anchor_lang::prelude::*;

#[error_code]
pub enum LockError {
    #[msg("Lock duration must be at least 30 days")]
    InvalidUnlockDate,

    #[msg("The lock has not expired yet")]
    Locked,
}
