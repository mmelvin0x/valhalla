use anchor_lang::prelude::*;

use crate::types::Authority;

#[account]
/// Represents a vault.
pub struct Vault {
    /// The identifier of the vault, a randomly generated number.
    pub identifier: u64,

    /// The name of the vault, string of length 32.
    pub name: [u8; 32],

    /// The public key of the creator of the vault.
    pub creator: Pubkey,

    /// The public key of the recipient of the vault.
    pub recipient: Pubkey,

    /// The public key of the mint associated with the vault.
    pub mint: Pubkey,

    /// The total duration of vesting for the vault.
    pub total_vesting_duration: u64,

    /// The timestamp when the vault was created.
    pub created_timestamp: u64,

    /// The bump value for the vault associated token account pda associated with the vault.
    pub token_account_bump: u8,

    /// The authority to cancel the vault.
    pub cancel_authority: Authority,

    /// The authority to change the recipient of the vault.
    pub change_recipient_authority: Authority,

    /// The start date of the vault.
    pub start_date: u64,

    /// The interval between each payout from the vault.
    pub payout_interval: u64,

    /// The amount to be paid out per interval from the vault.
    pub amount_per_payout: u64,

    /// The timestamp of the last payment made from the vault.
    pub last_payment_timestamp: u64,

    /// The number of payments made from the vault.
    pub number_of_payments_made: u64,
}

/// Implementation of the `Space` trait for the `Vault` struct.
impl Space for Vault {
    /// The initial space required for a `Vault` instance.
    const INIT_SPACE: usize = 8 + // discriminator
            8 + // identifier
            32 + // name
            32 + // creator
            32 + // recipient
            32 + // mint
            8 + // total_vesting_duration
            8 + // created_timestamp
            1 + // token_account_bump
            1 + // cancel_authority
            1 + // change_recipient_authority
            8 + // start_date
            8 + // payout_interval
            8 + // amount_per_payout
            8 + // last_payment_timestamp
            8; // number_of_payments_made
}
