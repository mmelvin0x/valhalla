use anchor_lang::prelude::*;

#[event]
pub struct AdminEvent {
    pub admin: Pubkey,
    pub treasury: Pubkey,
    pub fee: u64,
}

#[event]
pub struct LockDisbursed {
    pub funder: Pubkey,
    pub recipient: Pubkey,
    pub mint: Pubkey,
    pub name: String,
    pub amount: u64,
    pub is_cliff_payment: bool,
}

#[event]
pub struct LockUpdated {
    pub funder: Pubkey,
    pub recipient: Pubkey,
    pub updated_by: Pubkey,
    pub mint: Pubkey,
    pub name: String,
}

#[event]
pub struct LockCanceled {
    pub funder: Pubkey,
    pub recipient: Pubkey,
    pub canceled_by: Pubkey,
    pub mint: Pubkey,
    pub name: String,
}

#[event]
pub struct LockCreated {
    pub funder: Pubkey,
    pub recipient: Pubkey,
    pub mint: Pubkey,
    pub name: String,
}
