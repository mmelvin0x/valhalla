use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{ self, Mint, Token, TokenAccount, Transfer },
};

use crate::{ constants, state::Lock };

#[derive(Accounts)]
#[instruction(deposit_amount: u64)]
pub struct DepositToLock<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        seeds = [user.key().as_ref(), mint.key().as_ref(), constants::LOCK_SEED],
        bump,
        has_one = mint,
        has_one = user
    )]
    pub lock: Account<'info, Lock>,

    #[account(
        mut,
        seeds = [
            lock.key().as_ref(),
            user.key().as_ref(),
            mint.key().as_ref(),
            constants::LOCK_TOKEN_ACCOUNT_SEED,
        ],
        bump,
        token::mint = mint,
        token::authority = lock_token_account,
    )]
    pub lock_token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = user
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

pub fn deposit_to_lock(ctx: Context<DepositToLock>, deposit_amount: u64) -> Result<()> {
    let lock = &ctx.accounts.lock;
    let lock_token_account = &ctx.accounts.lock_token_account;
    let user_token_account = &ctx.accounts.user_token_account;

    // Prevent user from depositing more than they have
    let amount = if user_token_account.amount < deposit_amount {
        user_token_account.amount
    } else {
        deposit_amount
    };

    // Transfer tokens from user to lock
    let cpi_accounts = Transfer {
        from: user_token_account.to_account_info(),
        to: lock_token_account.to_account_info(),
        authority: ctx.accounts.user.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);

    token::transfer(cpi_ctx, amount)?;

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

    Ok(())
}
