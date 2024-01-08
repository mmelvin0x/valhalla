use anchor_lang::prelude::*;

use crate::errors::LockError;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, PartialEq)]
pub struct Schedule {
    pub unlock_date: u64,
    pub amount: u64,
}

#[account]
pub struct Lock {
    pub creator: Pubkey,
    pub beneficiary: Pubkey,
    pub mint: Pubkey,
    pub lock_token_account: Pubkey,
    pub creator_token_account: Pubkey,
    pub beneficiary_token_account: Pubkey,
    pub locked_date: u64,
    pub schedule_index: u64,
    pub schedules: Vec<Schedule>,
}

impl Lock {
    pub fn can_disperse(&self) -> bool {
        self.schedules.len() > 0 &&
            self.schedules[self.schedule_index as usize].unlock_date <
                (Clock::get().unwrap().unix_timestamp as u64)
    }

    pub fn format_schedules(schedules: Vec<Schedule>, decimals: u8) -> Vec<Schedule> {
        schedules
            .iter()
            .map(|s| Schedule {
                unlock_date: s.unlock_date,
                amount: s.amount.checked_mul((10u64).pow(decimals as u32)).unwrap(),
            })
            .collect::<Vec<Schedule>>()
    }

    pub fn validate_schedule_unlock_dates(&self, schedules: Vec<Schedule>) -> Result<()> {
        if schedules.len() == 0 {
            return Err(LockError::NoSchedules.into());
        }

        let mut prev_unlock_date = self.schedules
            .last()
            .map(|s| s.unlock_date)
            .unwrap_or(0);

        for s in schedules {
            if s.unlock_date < prev_unlock_date {
                return Err(LockError::InvalidSchedule.into());
            }

            prev_unlock_date = s.unlock_date;
        }

        Ok(())
    }

    pub fn validate_schedule_deposit_amount(&self, deposit_amount: u64) -> Result<()> {
        let schedule_amount: u64 = self.schedules
            .iter()
            .map(|s| s.amount)
            .sum();

        if deposit_amount < schedule_amount {
            return Err(LockError::DepositAmountTooLow.into());
        }

        Ok(())
    }
}
