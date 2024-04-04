import { LAMPORTS_PER_SOL, Transaction } from "@solana/web3.js";
import {
  TOKEN_2022_PROGRAM_ID,
  getExtensionTypes,
  getMinimumBalanceForRentExemptAccount,
  getMinimumBalanceForRentExemptAccountWithExtensions,
} from "@solana/spl-token";
import { Thread, TriggerInput } from "@clockwork-xyz/sdk";
import {
  Vault,
  getCronStringFromVault,
  getMintWithCorrectTokenProgram,
  sleep,
} from "@valhalla/lib";
import { clockworkProvider, connection, provider } from "./network";

import { BN } from "@coral-xyz/anchor";
import { disburse } from "./disburse";

export const scheduleAutopay = async (
  vault: Vault
): Promise<{ threadId: string; thread: Thread | null }> => {
  const interval = getCronStringFromVault(Number(vault.payoutInterval));
  const threadId = vault.identifier.toString();
  const [thread] = clockworkProvider.getThreadPDA(
    provider.wallet.publicKey,
    threadId
  );

  try {
    const existingThread = await clockworkProvider.getThreadAccount(thread);
    if (existingThread) {
      return { thread: existingThread, threadId };
    }
  } catch (error) {
    console.log(
      `Creating a new thread for Vault: ${vault.identifier.toString()}, Thread id: ${threadId}, address: ${thread}`
    );
  }

  const trigger: TriggerInput = {
    cron: { schedule: interval, skippable: true },
    timestamp: { unix_ts: new BN(vault.payoutInterval) },
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
    console.log(
      `Vault ${vault.identifier.toString()} autopay disbursement thread created: ${sig}`
    );

    await sleep(5000);
    const theThread = await clockworkProvider.getThreadAccount(thread);

    return { thread: theThread, threadId };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    if (!error.logs?.[3]) {
      console.error("Error creating thread: ", error);
    }

    return null;
  }
};
