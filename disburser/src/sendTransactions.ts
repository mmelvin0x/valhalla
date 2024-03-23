import {
  type Connection,
  type TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";

import type NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";

export async function sendTransaction(
  connection: Connection,
  payer: NodeWallet,
  instructions: TransactionInstruction[]
): Promise<string> {
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
    return "";
  }

  return txid;
}
