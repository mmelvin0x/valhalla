use anchor_lang::prelude::*;

#[account]
pub struct Config {
    pub admin: Pubkey,
    pub dev_treasury: Pubkey,
    pub dao_treasury: Pubkey,
    pub governance_token_mint_key: Pubkey,
    pub dev_fee: u64,
    pub token_fee_basis_points: u64,
    pub governance_token_amount: u64,
}

/// Implementation of the `Space` trait for the `Vault` struct.
impl Space for Config {
    /// The space required to store the configuration account.
    const INIT_SPACE: usize = 8 + 32 + 32 + 32 + 32 + 8 + 8 + 8;
}
