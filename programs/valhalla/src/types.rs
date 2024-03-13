use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, PartialEq)]
pub enum Authority {
    Neither,
    Creator,
    Recipient,
    Both,
}
