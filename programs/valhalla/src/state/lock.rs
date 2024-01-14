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
    pub number_of_payments_made: u64,
    pub is_cliff_payment_disbursed: bool,
    pub name: String,
}

impl Lock {
    pub fn size_of(name: &str) -> usize {
        8 + // discriminator
            32 + // funder
            32 + // recipient
            32 + // mint
            1 + // cancel_authority
            1 + // change_recipient_authority
            8 + // vesting_duration
            8 + // payout_interval
            8 + // amount_per_payout
            8 + // start_date
            8 + // cliff_payment_amount
            8 + // last_payment_timestamp
            8 + // number_of_payments_made
            1 + // is_cliff_payment_disbursed
            4 + // name length
            name.len()
    }
}
