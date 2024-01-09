use anchor_lang::prelude::*;

#[error_code]
pub enum LockError {
    /// 0x1770 - 6000
    #[msg("The fee is too high")]
    FeeOverflow,

    /// 0x1771 - 6001
    #[msg("Lock duration is invalid")]
    InvalidUnlockDate,

    /// 0x1772 - 6002
    #[msg("The lock has not expired yet")]
    Locked,

    /// 0x1773 - 6003
    #[msg("Not authorized to perform this action")]
    Unauthorized,

    /// 0x1774 - 6004
    #[msg("You do not have enough tokens to perform this action")]
    InsufficientFundsForDeposit,

    /// 0x1775 - 6005
    #[msg("You do not have enough tokens to perform this action")]
    InsufficientFundsForTotalPayouts,
}
