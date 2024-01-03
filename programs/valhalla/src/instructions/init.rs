use anchor_lang::prelude::*;
use anchor_spl::token::{ Mint, Token };

use crate::{ constants, state::Locker };

#[derive(Accounts)]
pub struct Init<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(init, payer = admin, seeds = [constants::LOCKER_SEED], space = Locker::LEN, bump)]
    pub locker: Account<'info, Locker>,

    #[account(
        init,
        payer = admin,
        mint::decimals = 0,
        mint::authority = reward_token_mint,
        seeds = [constants::LOCK_REWARD_MINT_SEED],
        bump
    )]
    pub reward_token_mint: Account<'info, Mint>,

    /// CHECK: Only read from and stored as a Pubkey on the Locker
    pub treasury: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
}

pub fn init(ctx: Context<Init>, fee: u64) -> Result<()> {
    let locker = &mut ctx.accounts.locker;

    locker.admin = ctx.accounts.admin.key();
    locker.treasury = ctx.accounts.treasury.key();
    locker.reward_token_mint = ctx.accounts.reward_token_mint.key();
    locker.fee = fee;

    Ok(())
}
