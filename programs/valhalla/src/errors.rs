use anchor_lang::prelude::*;

#[error_code]
pub enum LockError {
    #[msg("Lock duration is invalid")]
    InvalidUnlockDate,

    #[msg("The lock has not expired yet")]
    Locked,

    #[msg("Not authorized to perform this action")]
    Unauthorized,
}
