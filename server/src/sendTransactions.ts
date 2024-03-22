import {
  type Connection,
  type TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";

import type NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import { type Vault } from "./program";
import WinstonLogger from "./logger";

const MAX_TRANSACTION_SIZE = 1232;

export async function batchSendTransactions(
  connection: Connection,
  payer: NodeWallet,
  instructions: Array<{ vault: Vault; instruction: TransactionInstruction }>,
): Promise<number[]> {
  const logger = WinstonLogger.logger();
  const instructionCount = instructions.length;
  const instructionsSize = instructions.reduce(
    (acc, it) => acc + it.instruction.data.length,
    0,
  );
  console.log(
    "%c🤪 ~ file: sendTransactions.ts:24 [batchSendTransactions/instructionsSize] -> instructionsSize : ",
    "color: #d9eaed",
    instructionsSize,
  );

  const chunks = [];
  if (instructionsSize > MAX_TRANSACTION_SIZE / 2) {
    // Chunk the instructions into smaller transactions
    let chunk: Array<{ instruction: TransactionInstruction; vault: Vault }> =
      [];
    let chunkSize = 0;
    for (let i = 0; i < instructionCount; i++) {
      const vault = instructions[i].vault;
      const instruction = instructions[i].instruction;

      if (chunkSize + instruction.data.length > MAX_TRANSACTION_SIZE / 2) {
        chunks.push(chunk);
        chunk = [];
        chunkSize = 0;
      }

      chunk.push({ instruction, vault });
      chunkSize += instruction.data.length;
    }
  } else {
    chunks.push(instructions);
  }

  // Send the chunks
  let registeredIds: number[] = [];
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];

    logger.info(
      `Registering ${chunk.length} vaults in batch ${i + 1}/${chunks.length}`,
    );

    await sendTransaction(
      connection,
      payer,
      chunk.map((it) => it.instruction),
    );

    registeredIds = registeredIds.concat(
      chunk.map((it) => Number(it.vault.identifier)),
    );

    logger.info(`Registered ${instructions.length} vaults`);
  }

  return registeredIds;
}

export async function sendTransaction(
  connection: Connection,
  payer: NodeWallet,
  instructions: TransactionInstruction[],
): Promise<void> {
  const logger = WinstonLogger.logger();

  const latestBlockhash = await connection.getLatestBlockhash();
  const messageV0 = new TransactionMessage({
    payerKey: payer.publicKey,
    recentBlockhash: latestBlockhash.blockhash,
    instructions,
  }).compileToV0Message();

  const tx = new VersionedTransaction(messageV0);
  const txid = await connection.sendTransaction(tx);
  const confirmation = await connection.confirmTransaction({
    signature: txid,
    blockhash: latestBlockhash.blockhash,
    lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
  });

  if (confirmation.value.err != null || confirmation.value.err !== undefined) {
    throw new Error(confirmation.value.err?.toString());
  }

  logger.info(
    `Transaction sent Transaction ${txid.slice(0, 4)}...${txid.slice(-4)} has been sent`,
  );
}
