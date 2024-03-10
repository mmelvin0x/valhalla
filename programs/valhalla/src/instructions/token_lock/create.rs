use anchor_lang::{prelude::*, system_program};
use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{transfer_checked, Mint, TokenAccount, TokenInterface, TransferChecked},
};

use crate::{
    constants,
    errors::ValhallaError,
    state::{Config, TokenLock},
    VestingType,
};

#[derive(Accounts)]
pub struct CreateTokenLock<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,

    #[account(seeds = [constants::CONFIG_SEED], bump, has_one = treasury)]
    pub config: Box<Account<'info, Config>>,

    #[account(mut, constraint = config.treasury == treasury.key())]
    pub treasury: SystemAccount<'info>,

    #[account(
        init,
        payer = creator,
        seeds = [
            creator.key().as_ref(),
            mint.key().as_ref(),
            constants::TOKEN_LOCK_SEED,
        ],
        space = TokenLock::INIT_SPACE,
        bump
    )]
    pub token_lock: Box<Account<'info, TokenLock>>,

    #[account(
        init,
        seeds = [token_lock.key().as_ref(), constants::TOKEN_LOCK_TOKEN_ACCOUNT_SEED],
        bump,
        payer = creator,
        token::mint = mint,
        token::authority = token_lock_token_account,
        token::token_program = token_program
    )]
    pub token_lock_token_account: InterfaceAccount<'info, TokenAccount>,

    #[account(
        init_if_needed,
        payer = creator,
        associated_token::mint = mint,
        associated_token::authority = creator,
        associated_token::token_program = token_program
    )]
    pub creator_token_account: InterfaceAccount<'info, TokenAccount>,

    pub mint: InterfaceAccount<'info, Mint>,

    pub token_program: Interface<'info, TokenInterface>,

    pub associated_token_program: Program<'info, AssociatedToken>,

    pub system_program: Program<'info, System>,
}

impl<'info> CreateTokenLock<'info> {
    pub fn create(
        &mut self,
        name: [u8; 32],
        amount_to_be_vested: u64,
        total_vesting_duration: u64,
    ) -> Result<()> {
        let transfer_amount = self.validate_deposit(amount_to_be_vested)?;
        self.set_state(total_vesting_duration, name)?;
        self.transfer(transfer_amount)?;
        self.take_fee()
    }

    fn validate_deposit(&mut self, amount_to_be_vested: u64) -> Result<u64> {
        let balance = self.creator_token_account.amount;
        let amount = amount_to_be_vested
            .checked_mul((10u64).pow(self.mint.decimals as u32))
            .unwrap();

        if amount > balance {
            return Err(ValhallaError::InsufficientFundsForDeposit.into());
        }

        Ok(amount)
    }

    fn set_state(&mut self, total_vesting_duration: u64, name: [u8; 32]) -> Result<()> {
        self.token_lock.set_inner(TokenLock {
            creator: self.creator.key(),
            recipient: self.creator.key(),
            mint: self.mint.key(),
            total_vesting_duration,
            name,
            created_timestamp: Clock::get()?.unix_timestamp as u64,
            vesting_type: VestingType::TokenLock,
        });

        Ok(())
    }

    fn transfer(&self, amount: u64) -> Result<()> {
        let cpi_program = self.token_program.to_account_info();
        let cpi_accounts = TransferChecked {
            from: self.creator_token_account.to_account_info(),
            mint: self.mint.to_account_info(),
            to: self.token_lock_token_account.to_account_info(),
            authority: self.creator.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);

        transfer_checked(cpi_ctx, amount, self.mint.decimals)
    }

    fn take_fee(&mut self) -> Result<()> {
        let cpi_program = self.system_program.to_account_info();
        let cpi_accounts = system_program::Transfer {
            from: self.creator.to_account_info(),
            to: self.treasury.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);

        system_program::transfer(cpi_ctx, self.config.fee)
    }
}
