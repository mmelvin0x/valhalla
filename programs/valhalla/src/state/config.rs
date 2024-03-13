use anchor_lang::prelude::*;

#[account]
/// Represents the configuration for the Valhalla program.
pub struct Config {
    /// The public key of the admin account.
    pub admin: Pubkey,
    /// The public key of the treasury account.
    pub treasury: Pubkey,
    /// The fee amount in u64.
    pub fee: u64,
}

/// Implementation of the `Space` trait for the `Vault` struct.
impl Space for Config {
    /// The space required to store the configuration account.
    const INIT_SPACE: usize = 8 + 32 + 32 + 8;
}
