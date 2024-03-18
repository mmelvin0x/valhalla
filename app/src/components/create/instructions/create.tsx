import * as anchor from "@coral-xyz/anchor";

import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import {
  Connection,
  PublicKey,
  SystemProgram,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import {
  CreateInstructionAccounts,
  CreateInstructionArgs,
  createCreateInstruction,
} from "program";
import { FormikHelpers, FormikValues } from "formik";
import { getNameArg, shortenSignature } from "utils/formatters";

import { ICreateForm } from "utils/interfaces";
import { Valhalla } from "program/valhalla";
import { getPDAs } from "utils/constants";
import { isPublicKey } from "@metaplex-foundation/umi";
import { notify } from "utils/notifications";
import { randomBytes } from "crypto";
import router from "next/router";

export const createVault = async (
  values: FormikValues,
  helpers: FormikHelpers<ICreateForm>,
  wallet: any,
  connection: Connection,
  program: anchor.Program<Valhalla>,
  totalVestingDuration: number,
  balance: number,
  today: Date,
) => {
  if (Number(values.amountToBeVested) > balance) {
    helpers.setFieldError("amountToBeVested", "Amount exceeds token balance");

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

  const identifier = new anchor.BN(randomBytes(8));
  const createInstructionArgs: CreateInstructionArgs = {
    identifier,
    name: getNameArg(values.name),
    amountToBeVested: Number(values.amountToBeVested),
    totalVestingDuration: Math.round(Number(totalVestingDuration / 1000)),
    startDate: Math.round(new Date(values.startDate).getTime() / 1000),
    payoutInterval: Math.round(values.payoutInterval / 1000),
    cancelAuthority: values.cancelAuthority,
  };

  const mint = new PublicKey(values.selectedToken.id);
  const tokenProgramId = (await connection.getAccountInfo(mint))?.owner;
  const recipientKey = new PublicKey(values.recipient);
  const { config, vault, vaultAta } = getPDAs(
    identifier,
    wallet.publicKey,
    mint,
  );

  const configAccount = await program.account.config.fetch(config);
  const creatorAta = getAssociatedTokenAddressSync(
    mint,
    new PublicKey(wallet.publicKey),
    false,
    tokenProgramId,
  );
  const tokenTreasuryAta = getAssociatedTokenAddressSync(
    mint,
    configAccount.tokenTreasury,
    false,
    tokenProgramId,
  );

  const creatorGovernanceAta = getAssociatedTokenAddressSync(
    configAccount.governanceTokenMintKey,
    new PublicKey(wallet.publicKey),
    false,
    TOKEN_PROGRAM_ID,
  );

  const createInstructionAccounts: CreateInstructionAccounts = {
    creator: wallet.publicKey,
    recipient: recipientKey,
    solTreasury: configAccount.solTreasury,
    tokenTreasury: configAccount.tokenTreasury,
    config,
    vault,
    vaultAta,
    tokenTreasuryAta,
    creatorAta,
    creatorGovernanceAta,
    governanceTokenMint: configAccount.governanceTokenMintKey,
    mint,
    tokenProgram: tokenProgramId,
    governanceTokenProgram: TOKEN_PROGRAM_ID,
    associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
    systemProgram: SystemProgram.programId,
  };

  try {
    const createLockInstruction = createCreateInstruction(
      createInstructionAccounts,
      createInstructionArgs,
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
