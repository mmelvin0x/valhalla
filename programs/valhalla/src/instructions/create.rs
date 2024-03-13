use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{transfer_checked, Mint, TokenAccount, TokenInterface, TransferChecked},
};

use crate::{
    constants,
    errors::ValhallaError,
    state::{Config, Vault},
    Authority,
};

#[derive(Accounts)]
#[instruction(identifier: u64)]
/// Represents the instruction to create a vault.
pub struct CreateVault<'info> {
    #[account(mut)]
    /// The creator of the vault.
    pub creator: Signer<'info>,

    #[account(mut)]
    /// The recipient of the vault tokens.
    pub recipient: SystemAccount<'info>,

    #[account(seeds = [constants::CONFIG_SEED], bump, has_one = treasury)]
    /// The configuration account.
    pub config: Box<Account<'info, Config>>,

    #[account(mut)]
    /// The treasury account.
    pub treasury: SystemAccount<'info>,

    #[account(
        init,
        payer = creator,
        seeds = [
            identifier.to_le_bytes().as_ref(),
            creator.key().as_ref(),
            recipient.key().as_ref(),
            mint.key().as_ref(),
            constants::VAULT_SEED,
        ],
        space = Vault::INIT_SPACE,
        bump
    )]
    /// The vault account.
    pub vault: Box<Account<'info, Vault>>,

    #[account(
        init,
        seeds = [
            identifier.to_le_bytes().as_ref(),
            vault.key().as_ref(),
            constants::VAULT_ATA_SEED
        ],
        bump,
        payer = creator,
        token::mint = mint,
        token::authority = vault_ata,
        token::token_program = token_program
    )]
    /// The vault token account.
    pub vault_ata: InterfaceAccount<'info, TokenAccount>,

    #[account(
        init_if_needed,
        payer = creator,
        associated_token::mint = mint,
        associated_token::authority = creator,
    )]
    /// The creator's token account.
    pub creator_token_account: InterfaceAccount<'info, TokenAccount>,

    #[account(
        init_if_needed,
        payer = creator,
        associated_token::mint = mint,
        associated_token::authority = recipient,
    )]
    /// The recipient's token account.
    pub recipient_token_account: InterfaceAccount<'info, TokenAccount>,

    /// The mint of the token.
    pub mint: InterfaceAccount<'info, Mint>,

    /// The token program.
    pub token_program: Interface<'info, TokenInterface>,

    /// The associated token program.
    pub associated_token_program: Program<'info, AssociatedToken>,

    /// The system program.
    pub system_program: Program<'info, System>,
}

/// Implements the CreateVault instruction.
impl<'info> CreateVault<'info> {
    /// Creates a new vault with the specified parameters.
    ///
    /// # Arguments
    ///
    /// * `identifier` - The identifier for the vault.
    /// * `name` - The name of the vault.
    /// * `amount_to_be_vested` - The amount to be vested in the vault.
    /// * `total_vesting_duration` - The total duration of the vesting period.
    /// * `bump` - The bump value for the vault associated token account pda.
    /// * `cancel_authority` - The authority to cancel the vault, optional, defaults to Neither.
    /// * `change_recipient_authority` - The authority to change the recipient of the vault, optional, defaults to Neither.
    /// * `payout_interval` - The interval at which payouts will be made, optional, defaults to `total_vesting_duration`.
    /// * `start_date` - The start date of the vesting period, optional, defaults to `0`.
    ///
    /// # Errors
    ///
    /// This method returns an error if there are insufficient funds for the deposit or if any of the operations fail.
    ///
    /// # Returns
    ///
    /// This method returns `Ok(())` if the vault creation is successful.
    pub fn create(
        &mut self,
        identifier: u64,
        name: [u8; 32],
        amount_to_be_vested: u64,
        total_vesting_duration: u64,
        bump: u8,
        cancel_authority: Option<Authority>,
        change_recipient_authority: Option<Authority>,
        payout_interval: Option<u64>,
        start_date: Option<u64>,
    ) -> Result<()> {
        // Get default values for optional parameters.
        let (cancel, change, payout, start) = self.ok_or_defaults(
            total_vesting_duration,
            cancel_authority,
            change_recipient_authority,
            payout_interval,
            start_date,
        )?;

        let (amount, amount_per_payout) =
            self.make_deposit_amounts(amount_to_be_vested, total_vesting_duration, payout)?;

        // Set the vault state.
        let now = Clock::get()?.unix_timestamp as u64;
        self.vault.set_inner(Vault {
            identifier,
            name,
            creator: self.creator.key(),
            recipient: self.recipient.key(),
            mint: self.mint.key(),
            total_vesting_duration,
            created_timestamp: now,
            token_account_bump: bump,
            cancel_authority: cancel,
            change_recipient_authority: change,
            start_date: start,
            payout_interval: payout,
            amount_per_payout,
            last_payment_timestamp: now,
            number_of_payments_made: 0,
        });

        // Transfer the amount to the vault token account
        self.transfer_from_creator_to_vault(amount)
    }

    /// Returns the specified parameters or their default values.
    ///
    /// # Arguments
    ///
    /// * `total_vesting_duration` - The total duration of the vesting period.
    /// * `cancel_authority` - The authority to cancel the vault, optional, defaults to Neither.
    /// * `change_recipient_authority` - The authority to change the recipient of the vault, optional, defaults to Neither.
    /// * `payout_interval` - The interval at which payouts will be made, optional, defaults to `total_vesting_duration`.
    /// * `start_date` - The start date of the vesting period, optional, defaults to `0`.
    ///
    /// # Returns
    ///
    /// This method returns a tuple containing the specified parameters or their default values.
    fn ok_or_defaults(
        &self,
        total_vesting_duration: u64,
        cancel_authority: Option<Authority>,
        change_recipient_authority: Option<Authority>,
        payout_interval: Option<u64>,
        start_date: Option<u64>,
    ) -> Result<(Authority, Authority, u64, u64)> {
        let cancel = cancel_authority.unwrap_or(Authority::Neither);
        let change = change_recipient_authority.unwrap_or(Authority::Neither);
        let start = start_date.unwrap_or(0);

        let payout = if let Some(0) = payout_interval {
            total_vesting_duration
        } else {
            0
        };

        Ok((cancel, change, payout, start))
    }

    /// Returns the amount and the amount per payout per the specified parameters.
    ///
    /// # Arguments
    ///
    /// * `amount_to_be_vested` - The amount to be vested in the vault.
    /// * `total_vesting_duration` - The total duration of the vesting period.
    /// * `payout_interval` - The interval at which payouts will be made.
    ///
    /// # Errors
    ///
    /// This method returns an error if there are insufficient funds for the deposit.
    ///
    /// # Returns
    ///
    /// This method returns a tuple containing the amount and the amount per payout.
    fn make_deposit_amounts(
        &mut self,
        amount_to_be_vested: u64,
        total_vesting_duration: u64,
        payout_interval: u64,
    ) -> Result<(u64, u64)> {
        let amount = amount_to_be_vested
            .checked_mul((10u64).pow(self.mint.decimals as u32))
            .unwrap();

        // The total number of payouts to be made from the vault is
        // the total vesting duration divided by the payout interval,
        // or 1 if the total vesting duration is less than the payout interval.
        let total_payouts = total_vesting_duration
            .checked_div(payout_interval)
            .unwrap_or(1);

        // The amount per payout is the amount to be vested divided by the total
        // number of payouts, or the amount to be vested if the total number of payouts is 1.
        let amount_per_payout = amount
            .checked_div(total_payouts)
            .unwrap_or(amount_to_be_vested);

        // The total payout amount is the amount per payout multiplied by the total number of payouts.
        let total_payout_amount = amount_per_payout.checked_mul(total_payouts).unwrap();

        // Check if the creator has enough balance for the total payout amount
        if total_payout_amount > amount {
            return Err(ValhallaError::InsufficientFundsForDeposit.into());
        }

        Ok((amount, amount_per_payout))
    }

    /// Transfers SPL tokens from the creator's token account to the vault token account.
    ///
    /// # Arguments
    ///
    /// * `amount` - The amount to be transferred to the vault token account.
    ///
    /// # Errors
    ///
    /// This method returns an error if there is an error during the CPI (Cross-Program Invocation) call.
    ///
    /// # Returns
    ///
    /// This method returns `Ok(())` if the transfer is successful.
    fn transfer_from_creator_to_vault(&self, amount: u64) -> Result<()> {
        let cpi_program = self.token_program.to_account_info();
        let cpi_accounts = TransferChecked {
            from: self.creator_token_account.to_account_info(),
            to: self.vault_ata.to_account_info(),
            authority: self.creator.to_account_info(),
            mint: self.mint.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);

        msg!(
            "DEBUG: Transferring {} tokens to the vault token account",
            amount
        );
        msg!(
            "DEBUG: Creator Balance Before: {}",
            self.creator_token_account.amount
        );

        transfer_checked(cpi_ctx, amount, self.mint.decimals)?;

        msg!(
            "DEBUG: Creator Balance After: {}",
            self.creator_token_account.amount
        );

        Ok(())
    }
}
