use anchor_lang::prelude::*;

#[constant]
pub const MIN_REWARD_AMOUNT: u64 = 1_000;

#[constant]
pub const LOCKER_SEED: &[u8] = b"locker";

#[constant]
pub const LOCK_SEED: &[u8] = b"lock";

#[constant]
pub const LOCK_TOKEN_ACCOUNT_SEED: &[u8] = b"token";

#[constant]
pub const LOCK_REWARD_MINT_SEED: &[u8] = b"reward";
