use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, PartialEq)]
pub enum Authority {
    Neither,
    Funder,
    Recipient,
    Both,
}

#[account]
pub struct Lock {
    pub funder: Pubkey,
    pub recipient: Pubkey,
    pub mint: Pubkey,
    pub cancel_authority: Authority,
    pub change_recipient_authority: Authority,
    pub vesting_duration: u64,
    pub payout_interval: u64,
    pub amount_per_payout: u64,
    pub start_date: u64,
    pub cliff_payment_amount: u64,
    pub last_payment_timestamp: u64,
    pub cliff_payment_amount_paid: bool,
}

impl Lock {
    pub fn size_of() -> usize {
        8 + 32 + 32 + 32 + 1 + 1 + 8 + 8 + 8 + 8 + 8 + 8 + 1
    }
}
