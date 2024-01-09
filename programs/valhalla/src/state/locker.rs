use anchor_lang::prelude::*;

#[account]
pub struct Locker {
    pub admin: Pubkey,
    pub treasury: Pubkey,
    pub fee: u64,
}

impl Locker {
    pub fn size_of() -> usize {
        8 + 32 + 32 + 8
    }

    pub fn admin(&self) -> Pubkey {
        self.admin
    }

    pub fn treasury(&self) -> Pubkey {
        self.treasury
    }

    pub fn fee(&self) -> u64 {
        self.fee
    }
}
