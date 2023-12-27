type TokenLockParameters = {
  lockLength: number; // in seconds
  percentOfSupplyLocked: number; // 0 to 1 (e.g., 0.5 for 50%)
  freezeAuthorityRenounced: boolean;
  mintAuthorityRenounced: boolean;
};

export function scoreTokenLock(params: TokenLockParameters): string {
  // Define weightings
  const weights = {
    lockLength: 0.1,
    percentOfSupplyLocked: 0.5,
    authorityRenounced: 0.4, // Combined weight for both freeze and mint authority
  };

  // Normalize lock length (90 days in seconds: 90 * 24 * 60 * 60)
  const maxLockLengthSeconds = 90 * 24 * 60 * 60;
  const normalizedLockLength = Math.min(
    params.lockLength / maxLockLengthSeconds,
    1
  );

  // Normalize authorities (1 if renounced, 0 otherwise)
  const normalizedFreezeAuthority = params.freezeAuthorityRenounced ? 1 : 0;
  const normalizedMintAuthority = params.mintAuthorityRenounced ? 1 : 0;

  // Calculate preliminary score
  let score =
    normalizedLockLength * weights.lockLength +
    params.percentOfSupplyLocked * weights.percentOfSupplyLocked +
    ((normalizedFreezeAuthority + normalizedMintAuthority) *
      weights.authorityRenounced) /
      2;

  // Scale to 0-10 and round to one decimal place
  score = Math.round(score * 10 * 10) / 10;

  // Ensure score is within bounds
  return Math.min(Math.max(score, 0), 10).toFixed(1);
}

// // Example usage
// const tokenLockParams: TokenLockParameters = {
//   lockLength: 60 * 60 * 24 * 45, // 45 days in seconds
//   percentOfSupplyLocked: 0.5, // 50%
//   freezeAuthorityRenounced: true,
//   mintAuthorityRenounced: false,
// };

// console.log("Token Lock Score:", scoreTokenLock(tokenLockParams));
