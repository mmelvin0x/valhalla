import {
  Connection,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";

import { WalletContextState } from "@solana/wallet-adapter-react";
import { notify } from "./notifications";
import { shortenSignature } from "@valhalla/lib";

export const sendTransaction = async (
  connection: Connection,
  payer: WalletContextState,
  instructions: TransactionInstruction[]
) => {
  if (!payer.publicKey) return;

  const latestBlockhash = await connection.getLatestBlockhash();
  const messageV0 = new TransactionMessage({
    payerKey: payer.publicKey,
    recentBlockhash: latestBlockhash.blockhash,
    instructions,
  }).compileToV0Message();

  try {
    const tx = new VersionedTransaction(messageV0);
    const txid = await payer.sendTransaction(tx, connection);
    const confirmation = await connection.confirmTransaction({
      signature: txid,
      blockhash: latestBlockhash.blockhash,
      lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
    });

    if (confirmation.value.err) {
      notify({
        message: "Transaction Failed",
        description: `Transaction ${shortenSignature(txid)} failed (${
          confirmation.value.err
        })`,
        type: "error",
      });
    }

    notify({
      message: "Transaction sent",
      description: `Transaction ${shortenSignature(txid)} has been sent`,
      type: "success",
    });

    return txid;
  } catch (error) {
    console.error("Error sending transaction:", error);
    throw error;
  }
};
