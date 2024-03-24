import {
  Connection,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";

import { ExplorerLink } from "../components/ExplorerLink";
import { WalletContextState } from "@solana/wallet-adapter-react";
import { shortenSignature } from "@valhalla/lib";
import { toast } from "react-toastify";

export const sendTransaction = async (
  connection: Connection,
  payer: WalletContextState,
  instructions: TransactionInstruction[],
  toastId: string
) => {
  if (!payer.publicKey) return;

  try {
    const latestBlockhash = await connection.getLatestBlockhash();
    const messageV0 = new TransactionMessage({
      payerKey: payer.publicKey,
      recentBlockhash: latestBlockhash.blockhash,
      instructions,
    }).compileToV0Message();

    const tx = new VersionedTransaction(messageV0);
    const txid = await payer.sendTransaction(tx, connection);
    const confirmation = await connection.confirmTransaction({
      signature: txid,
      blockhash: latestBlockhash.blockhash,
      lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
    });

    if (confirmation.value.err) {
      toast.update(toastId, {
        type: "error",
        render: (
          <ExplorerLink
            address={txid}
            label={`Transaction failed: ${shortenSignature(txid)}`}
            type="tx"
          />
        ),
      });
    }

    toast.update(toastId, {
      type: "success",
      render: (
        <ExplorerLink
          address={txid}
          label={`Transaction sent: ${shortenSignature(txid)}`}
          type="tx"
        />
      ),
    });

    return txid;
  } catch (error) {
    toast.update(toastId, {
      type: "error",
      render: `Transaction failed: ${(error as Error).message}`,
    });
  }
};
