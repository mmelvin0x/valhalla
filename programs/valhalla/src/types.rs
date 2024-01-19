use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, PartialEq)]
pub enum Authority {
    Neither,
    Funder,
    Recipient,
    Both,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, PartialEq)]
pub enum VestingType {
    VestingSchedule,
    TokenLock,
    OneTimePayment,
}
