use anchor_lang::prelude::*;

declare_id!("93Z6sREJZSm5vrn8tJyuEf1UVZLpMDX7NAmcdn8PLKYZ");

#[program]
pub mod token_creation {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
