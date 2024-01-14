use anchor_lang::prelude::*;

#[error_code]
pub enum LockError {
    /// 0x1770 - 6000
    #[msg("The lock has not expired yet!")]
    Locked,

    /// 0x1771 - 6001
    #[msg("Not authorized to perform this action!")]
    Unauthorized,

    /// 0x1772 - 6002
    #[msg("You do not have enough tokens to perform this action!")]
    InsufficientFundsForDeposit,

    /// 0x1773 - 6003
    #[msg("No payout!")]
    NoPayout,

    /// 0x1774 - 6004
    #[msg("Name is too long!")]
    NameTooLong,
}
