use anchor_lang::prelude::*;

#[constant]
pub const CONFIG_SEED: &[u8] = b"config";

#[constant]
pub const VESTING_SCHEDULE_SEED: &[u8] = b"vesting_schedule";

#[constant]
pub const VESTING_SCHEDULE_TOKEN_ACCOUNT_SEED: &[u8] = b"vesting_schedule_token_account";

#[constant]
pub const TOKEN_LOCK_SEED: &[u8] = b"token_lock";

#[constant]
pub const TOKEN_LOCK_TOKEN_ACCOUNT_SEED: &[u8] = b"token_lock_token_account";

#[constant]
pub const SCHEDULED_PAYMENT_SEED: &[u8] = b"scheduled_payment";

#[constant]
pub const SCHEDULED_PAYMENT_TOKEN_ACCOUNT_SEED: &[u8] = b"scheduled_payment_token_account";
