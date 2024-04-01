import { PROGRAM_ID, Vault } from "./program";

import { BN } from "bn.js";
import { Connection } from "@solana/web3.js";
import { ValhallaVault } from "./models";
import { getAccount } from "@solana/spl-token";
import { getMintWithCorrectTokenProgram } from "./getMintWithCorrectTokenProgram";
import { getPDAs } from "./getPDAs";

export async function canDisburseVault(
  connection: Connection,
  vault: Vault | ValhallaVault
): Promise<boolean> {
  const currentTime = Math.floor(Date.now() / 1000);
  const payoutInterval = Number(vault.payoutInterval);
  const lastPaymentTimestamp = Number(vault.lastPaymentTimestamp);
  const totalNumberOfPayouts = Number(vault.totalNumberOfPayouts);
  const startDate = Number(vault.startDate);
  const endDate = totalNumberOfPayouts * payoutInterval;

  if (endDate > currentTime) return false;

  const { vaultAta } = getPDAs(
    PROGRAM_ID,
    new BN(vault.identifier),
    vault.creator,
    vault.mint
  );

  const { tokenProgramId } = await getMintWithCorrectTokenProgram(
    connection,
    vault
  );

  const ata = await getAccount(
    connection,
    vaultAta,
    "confirmed",
    tokenProgramId
  );

  const balance = Number(ata.amount);

  return (
    balance > 0 &&
    startDate <= currentTime &&
    lastPaymentTimestamp + payoutInterval <= currentTime
  );
}
