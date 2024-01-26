import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import {
  Connection,
  PublicKey,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import {
  CreateVestingScheduleInstructionAccounts,
  CreateVestingScheduleInstructionArgs,
  createCreateVestingScheduleInstruction,
} from "program";
import { FormikHelpers, FormikValues } from "formik";
import { TREASURY, getPDAs } from "utils/constants";
import { getNameArg, shortenSignature } from "utils/formatters";

import { ICreateForm } from "utils/interfaces";
import { isPublicKey } from "@metaplex-foundation/umi";
import { notify } from "utils/notifications";
import router from "next/router";

export const createVestingSchedule = async (
  values: FormikValues,
  helpers: FormikHelpers<ICreateForm>,
  wallet: any,
  connection: Connection,
  totalVestingDuration: number,
  balance: number,
  today: Date,
) => {
  if (
    Number(values.amountToBeVested) + Number(values.cliffPaymentAmount) >
    balance
  ) {
    helpers.setFieldError("amountToBeVested", "Amount exceeds token balance");
    helpers.setFieldError("cliffPaymentAmount", "Amount exceeds token balance");

    return;
  }

  if (values.vestingEndDate <= values.startDate) {
    helpers.setFieldError("vestingEndDate", "Invalid Date");
    return;
  }

  if (values.startDate < today) {
    helpers.setFieldError("startDate", "Invalid Date");
    return;
  }

  if (!isPublicKey(values.recipient)) {
    helpers.setFieldError("recipient", "Invalid Address");
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

  const createLockInstructionArgs: CreateVestingScheduleInstructionArgs = {
    amountToBeVested: Number(values.amountToBeVested),
    totalVestingDuration: Math.round(Number(totalVestingDuration / 1000)),
    payoutInterval: Math.round(values.payoutInterval / 1000),
    cliffPaymentAmount: Number(values.cliffPaymentAmount),
    startDate: Math.round(new Date(values.startDate).getTime() / 1000),
    cancelAuthority: values.cancelAuthority,
    changeRecipientAuthority: values.changeRecipientAuthority,
    name: getNameArg(values.name),
  };

  const mint = new PublicKey(values.selectedToken.id);
  const tokenProgramId = (await connection.getAccountInfo(mint))?.owner;
  const recipientKey = new PublicKey(values.recipient);
  const pdas = getPDAs(wallet.publicKey, recipientKey, mint);
  const creatorTokenAccount = getAssociatedTokenAddressSync(
    mint,
    new PublicKey(wallet.publicKey),
    false,
    tokenProgramId,
  );
  const recipientTokenAccount = getAssociatedTokenAddressSync(
    mint,
    new PublicKey(values.recipient),
    false,
    tokenProgramId,
  );

  const createLockInstructionAccounts: CreateVestingScheduleInstructionAccounts =
    {
      creator: wallet.publicKey,
      recipient: new PublicKey(values.recipient),
      config: pdas.config,
      treasury: TREASURY,
      vestingSchedule: pdas.vestingSchedule,
      vestingScheduleTokenAccount: pdas.vestingScheduleTokenAccount,
      creatorTokenAccount,
      recipientTokenAccount,
      mint,
      tokenProgram: tokenProgramId,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
    };

  try {
    const createLockInstruction = createCreateVestingScheduleInstruction(
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
    console.log("-> ~ error", error);
    notify({
      message: "Transaction Failed",
      description: `${error}`,
      type: "error",
    });
  }
};
