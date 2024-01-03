use anchor_lang::{ prelude::*, system_program };
use anchor_spl::{ associated_token::AssociatedToken, token::{ self, Mint, Token, TokenAccount } };

use crate::{ constants, state::{ Lock, Locker } };

#[derive(Accounts)]
#[instruction(unlock_date: u64, amount: u64)]
pub struct CreateLock<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(seeds = [constants::LOCKER_SEED], bump, has_one = treasury)]
    pub locker: Account<'info, Locker>,

    #[account(mut, constraint = locker.treasury == treasury.key())]
    /// CHECK: Only receives the fee
    pub treasury: AccountInfo<'info>,

    #[account(
        init,
        payer = user,
        seeds = [user.key().as_ref(), mint.key().as_ref(), constants::LOCK_SEED],
        space = Lock::LEN,
        bump
    )]
    pub lock: Account<'info, Lock>,

    #[account(
        init_if_needed,
        seeds = [
            lock.key().as_ref(),
            user.key().as_ref(),
            mint.key().as_ref(),
            constants::LOCK_TOKEN_ACCOUNT_SEED,
        ],
        bump,
        payer = user,
        token::mint = mint,
        token::authority = lock_token_account
    )]
    pub lock_token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = user,
    )]
    pub user_token_account: Account<'info, TokenAccount>,

    #[account(
        init_if_needed,
        payer = user,
        associated_token::mint = reward_token_mint,
        associated_token::authority = user
    )]
    pub user_reward_token_account: Account<'info, TokenAccount>,

    pub mint: Account<'info, Mint>,

    #[account(seeds = [constants::LOCK_REWARD_MINT_SEED], bump)]
    pub reward_token_mint: Account<'info, Mint>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

pub fn create_lock(ctx: Context<CreateLock>, unlock_date: u64, deposit_amount: u64) -> Result<()> {
    let lock = &mut ctx.accounts.lock;

    // Set lock state
    lock.user = ctx.accounts.user.key();
    lock.mint = ctx.accounts.mint.key();
    lock.lock_token_account = ctx.accounts.lock_token_account.to_account_info().key();
    lock.user_token_account = ctx.accounts.user_token_account.to_account_info().key();
    lock.locked_date = Clock::get()?.unix_timestamp as u64;
    lock.unlock_date = unlock_date;

    // Prevent user from depositing more than they have
    let amount = if ctx.accounts.user_token_account.amount < deposit_amount {
        ctx.accounts.user_token_account.amount
    } else {
        deposit_amount
    };

    // Transfer the user's tokens to the lock token account
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_accounts = token::TransferChecked {
        from: ctx.accounts.user_token_account.to_account_info(),
        to: ctx.accounts.lock_token_account.to_account_info(),
        authority: ctx.accounts.user.to_account_info(),
        mint: ctx.accounts.mint.to_account_info(),
    };
    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);

    token::transfer_checked(cpi_ctx, amount, ctx.accounts.mint.decimals)?;

    // Mint the reward tokens to the lock token account based on the percentage of supply being
    // locked and how long the lock is for
    let total_supply = ctx.accounts.mint.supply;
    let mut reward_amount = ((((amount as f64) * 100.0) / (total_supply as f64)) *
        ((lock.unlock_date - lock.locked_date) as f64)) as u64;

    msg!("reward_amount: {}", reward_amount);

    // Ensure the reward amount is greater than the minimum
    if reward_amount < constants::MIN_REWARD_AMOUNT {
        reward_amount = constants::MIN_REWARD_AMOUNT;
    }

    let bump = ctx.bumps.reward_token_mint;
    let signer: &[&[&[u8]]] = &[&[constants::LOCK_REWARD_MINT_SEED, &[bump]]];
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_accounts = token::MintTo {
        mint: ctx.accounts.reward_token_mint.to_account_info(),
        to: ctx.accounts.user_reward_token_account.to_account_info(),
        authority: ctx.accounts.reward_token_mint.to_account_info(),
    };
    let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);

    token::mint_to(cpi_ctx, reward_amount)?;

    // Transfer the SOL fee from the user to the admin
    let cpi_program = ctx.accounts.system_program.to_account_info();
    let cpi_accounts = system_program::Transfer {
        from: ctx.accounts.user.to_account_info(),
        to: ctx.accounts.treasury.to_account_info(),
    };
    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);

    system_program::transfer(cpi_ctx, ctx.accounts.locker.fee)?;

    Ok(())
}
