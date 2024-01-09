use anchor_lang::prelude::*;

#[error_code]
pub enum LockError {
    #[msg("The fee is too high")]
    FeeOverflow,

    #[msg("Lock duration is invalid")]
    InvalidUnlockDate,

    #[msg("The lock has not expired yet")]
    Locked,

    #[msg("Not authorized to perform this action")]
    Unauthorized,

    #[msg("You do not have enough tokens to perform this action")]
    InsufficientFundsForDeposit,

    #[msg("You do not have enough tokens to perform this action")]
    InsufficientFundsForTotalPayouts,
}
