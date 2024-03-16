use anchor_lang::prelude::*;

#[error_code]
pub enum ValhallaError {
    /// 0x1770 - 6000
    #[msg("The vault is locked!")]
    Locked,

    /// 0x1771 - 6001
    #[msg("Not authorized to perform this action!")]
    Unauthorized,

    /// 0x1772 - 6002
    #[msg("No payout!")]
    NoPayout,

    /// 0x1773 - 6003
    #[msg("Config account is already initialized!")]
    AlreadyInitialized,

    /// 0x1774 - 6004
    #[msg("Closing the vault failed!")]
    CloseVaultFailed,

    /// 0x1775 - 6005
    #[msg("Token fee basis points are invalid!")]
    InvalidTokenFeeBasisPoints,

    /// 0x1776 - 6006
    #[msg("SOL fee is invalid!")]
    InvalidSolFee,

    /// 0x1777 - 6007
    #[msg("Fee payment failed!")]
    FeePaymentFailed,
}
