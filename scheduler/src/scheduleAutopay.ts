import { LAMPORTS_PER_SOL, Transaction } from "@solana/web3.js";
import {
  TOKEN_2022_PROGRAM_ID,
  getExtensionTypes,
  getMinimumBalanceForRentExemptAccount,
  getMinimumBalanceForRentExemptAccountWithExtensions,
} from "@solana/spl-token";
import {
  Vault,
  getCronStringFromVault,
  getMintWithCorrectTokenProgram,
} from "@valhalla/lib";
import { clockworkProvider, connection, provider } from "./network";

import { disburse } from "./disburse";

export const scheduleAutoPay = async (
  vault: Vault,
  scheduledVaults: Map<string, string>
) => {
  const interval = getCronStringFromVault(Number(vault.payoutInterval));
  const threadId = vault.identifier.toString();
  const [thread] = clockworkProvider.getThreadPDA(
    provider.wallet.publicKey,
    threadId
  );

  try {
    const existingThread = await clockworkProvider.getThreadAccount(thread);
    if (existingThread) {
      return;
    }
  } catch (error) {
    console.log(
      `Creating a new thread for Vault: ${vault.identifier.toString()}, Thread id: ${threadId}, address: ${thread}`
    );
  }

  const trigger = {
    cron: { schedule: interval, skippable: false },
  };

  let rent = 0;
  const clockworkFee = 1000;
  const { mint, tokenProgramId } = await getMintWithCorrectTokenProgram(
    connection,
    vault
  );

  if (tokenProgramId === TOKEN_2022_PROGRAM_ID) {
    const extensions = await getExtensionTypes(mint.tlvData);
    rent = await getMinimumBalanceForRentExemptAccountWithExtensions(
      connection,
      extensions
    );
  } else {
    rent = await getMinimumBalanceForRentExemptAccount(connection);
  }

  const funding =
    (rent + clockworkFee) * Number(vault.totalNumberOfPayouts) +
    0.001 * LAMPORTS_PER_SOL;

  try {
    const disburseIx = await disburse(vault);
    const ix = await clockworkProvider.threadCreate(
      provider.wallet.publicKey,
      threadId,
      [disburseIx],
      trigger,
      funding
    );

    const tx = new Transaction().add(ix);
    const sig = await clockworkProvider.anchorProvider.sendAndConfirm(tx);
    scheduledVaults.set(vault.identifier.toString(), threadId);
    console.log(
      `Vault ${vault.identifier.toString()} autopay disbursement thread created: ${sig}`
    );
  } catch (error) {
    if (!error.logs?.[3]) {
      console.error("Error creating thread: ", error);
    }
  }
};
