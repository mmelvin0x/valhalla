import {
  Connection,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import { shortenSignature, sleep } from "@valhalla/lib";

import { ExplorerLink } from "../components/ExplorerLink";
import { WalletContextState } from "@solana/wallet-adapter-react";
import { toast } from "react-toastify";

export const sendTransaction = async (
  connection: Connection,
  payer: WalletContextState,
  instructions: TransactionInstruction[],
  toastId: string
): Promise<string> => {
  if (!payer.publicKey) return "";

  // instructions = await withPriorityFees({
  //   connection,
  //   computeUnits: 90_000,
  //   instructions,
  // });

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

  // This gives the vault time to create before a lookup is done on it when it tries to create
  // the clockwork thread for autopay
  await sleep(2500);
  return txid;
};
