use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, PartialEq)]
pub enum Authority {
    Neither,
    Creator,
    Recipient,
    Both,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, PartialEq)]
pub enum Autopay {
    None,
    NotRegistered,
    Registered,
}
