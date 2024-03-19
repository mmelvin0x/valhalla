use anchor_lang::prelude::*;

#[account]
/// Represents the configuration for the Valhalla program.
pub struct Config {
    /// The public key of the admin account.
    pub admin: Pubkey,

    /// The public key of the dev treasury account.
    pub dev_treasury: Pubkey,

    /// The public key of the dao treasury account.
    pub dao_treasury: Pubkey,

    /// The public key of the token mint used for rewards.
    pub governance_token_mint_key: Pubkey,

    /// The amount of sol taken as a flat fee to the dev treasury.
    pub dev_fee: u64,

    /// The basis points of the token fee.
    pub token_fee_basis_points: u64,

    /// The governance token reward amount
    pub governance_token_amount: u64,
}

/// Implementation of the `Space` trait for the `Vault` struct.
impl Space for Config {
    /// The space required to store the configuration account.
    const INIT_SPACE: usize = 8 + 32 + 32 + 32 + 32 + 8 + 8 + 8;
}
