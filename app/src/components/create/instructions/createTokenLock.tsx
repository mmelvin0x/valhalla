import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import {
  Authority,
  CreateTokenLockInstructionAccounts,
  CreateTokenLockInstructionArgs,
  createCreateTokenLockInstruction,
} from "program";
import {
  Connection,
  PublicKey,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import { FormikHelpers, FormikValues } from "formik";
import { TREASURY, getPDAs } from "utils/constants";
import { getNameArg, shortenSignature } from "utils/formatters";

import { ICreateForm } from "utils/interfaces";
import { isPublicKey } from "@metaplex-foundation/umi";
import { notify } from "utils/notifications";
import router from "next/router";

export const createTokenLock = async (
  values: FormikValues,
  helpers: FormikHelpers<ICreateForm>,
  wallet: any,
  connection: Connection,
  totalVestingDuration: number,
  balance: number,
  today: Date,
) => {
  if (Number(values.amountToBeVested) > balance) {
    helpers.setFieldError("amountToBeVested", "Amount exceeds token balance");
    return;
  }

  if (totalVestingDuration < 1) {
    helpers.setFieldError("vestingEndDate", "Invalid Date");
    return;
  }

  if (!isPublicKey(values.selectedToken?.id)) {
    notify({
      message: "Invalid token",
      description: "Token not found",
      type: "error",
    });

    return;
  }

  const createLockInstructionArgs: CreateTokenLockInstructionArgs = {
    name: getNameArg(values.name),
    totalVestingDuration: Math.round(Number(totalVestingDuration / 1000)),
    amountToBeVested: Number(values.amountToBeVested),
  };

  const mint = new PublicKey(values.selectedToken.id);
  const pdas = getPDAs(wallet.publicKey, null, mint);
  const creatorTokenAccount = getAssociatedTokenAddressSync(
    mint,
    new PublicKey(wallet.publicKey),
    false,
    TOKEN_2022_PROGRAM_ID,
  );

  const createLockInstructionAccounts: CreateTokenLockInstructionAccounts = {
    creator: wallet.publicKey,
    config: pdas.config,
    treasury: TREASURY,
    tokenLock: pdas.tokenLock,
    tokenLockTokenAccount: pdas.tokenLockTokenAccount,
    creatorTokenAccount,
    mint,
    tokenProgram: TOKEN_2022_PROGRAM_ID,
    associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
  };

  try {
    const createLockInstruction = createCreateTokenLockInstruction(
      createLockInstructionAccounts,
      createLockInstructionArgs,
    );

    const latestBlockhash = await connection.getLatestBlockhash();
    const messageV0 = new TransactionMessage({
      payerKey: wallet.publicKey,
      recentBlockhash: latestBlockhash.blockhash,
      instructions: [createLockInstruction],
    }).compileToV0Message();

    const tx = new VersionedTransaction(messageV0);
    const txid = await wallet.sendTransaction(tx, connection);
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

    router.push(`/dashboard/${wallet.publicKey.toBase58()}`);
  } catch (error) {
    console.log(error);
    notify({
      message: "Transaction Failed",
      description: `${error}`,
      type: "error",
    });
  }
};
