import { Vault } from "../program";

export function canDisburseVault(vault: Vault): boolean {
  const currentTime = Math.floor(Date.now() / 1000);
  const payoutInterval = Number(vault.payoutInterval);
  const lastPaymentTimestamp = Number(vault.lastPaymentTimestamp);
  const totalNumberOfPayouts = Number(vault.totalNumberOfPayouts);
  const startDate = Number(vault.startDate);
  const endDate = totalNumberOfPayouts * payoutInterval;

  if (endDate > currentTime) return false;

  return (
    startDate <= currentTime &&
    lastPaymentTimestamp + payoutInterval <= currentTime
  );
}
