import * as anchor from "@coral-xyz/anchor";

import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  NATIVE_MINT,
  NATIVE_MINT_2022,
  createAssociatedTokenAccountInstruction,
  createSyncNativeInstruction,
  getAccount,
  getAssociatedTokenAddressSync,
  getMint,
} from "@solana/spl-token";
import {
  Config,
  CreateInstructionAccounts,
  CreateInstructionArgs,
  PROGRAM_ID,
  createCreateInstruction,
  getNameArg,
  getPDAs,
} from "@valhalla/lib";
import {
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import { FormikHelpers, FormikValues } from "formik";

import { ICreateForm } from "../utils/interfaces";
import { WalletContextState } from "@solana/wallet-adapter-react";
import { isPublicKey } from "@metaplex-foundation/umi";
import { notify } from "../utils/notifications";
import { randomBytes } from "crypto";
import router from "next/router";
import { sendTransaction } from "../utils/sendTransaction";

export const createVault = async (
  values: ICreateForm[],
  helpers: FormikHelpers<ICreateForm>,
  wallet: WalletContextState,
  connection: Connection,
  totalVestingDuration: number,
  today: Date
) => {
  const isValid = await vaultValid(connection, values, helpers, today);
  if (!isValid) return;

  let instructions: TransactionInstruction[] = [];
  for (const value of values) {
    instructions = [
      ...instructions,
      ...(await getInstructions(
        connection,
        wallet,
        value,
        totalVestingDuration
      )),
    ];
  }

  await sendTransaction(connection, wallet, instructions);

  router.push(`/dashboard`);
};

const isNativeMint = (mint: PublicKey) => {
  return mint.equals(NATIVE_MINT) || mint.equals(NATIVE_MINT_2022);
};

const vaultValid = async (
  connection: Connection,
  values: FormikValues,
  helpers: FormikHelpers<ICreateForm>,
  today: Date
) => {
  const mint = await getMint(
    connection,
    new PublicKey(values.selectedToken.id)
  );
  const userAtaAddress = getAssociatedTokenAddressSync(
    new PublicKey(values.selectedToken.id),
    new PublicKey(values.recipient),
    false
  );
  const userAta = await getAccount(connection, userAtaAddress);
  const balance = Number(userAta.amount / BigInt(10 ** mint.decimals));
  if (BigInt(values.amountToBeVested) > balance) {
    helpers.setFieldError("amountToBeVested", "Amount exceeds token balance");

    return false;
  }

  if (values.vestingEndDate <= values.startDate) {
    helpers.setFieldError("vestingEndDate", "Invalid Date");
    return false;
  }

  if (values.startDate < today) {
    helpers.setFieldError("startDate", "Invalid Date");
    return false;
  }

  if (!isPublicKey(values.recipient)) {
    helpers.setFieldError("recipient", "Invalid Address");
    return false;
  }

  if (!isPublicKey(values.selectedToken?.id)) {
    notify({
      message: "Invalid token",
      description: "Token not found",
      type: "error",
    });

    return false;
  }

  return true;
};

const getInstructions = async (
  connection: Connection,
  wallet: WalletContextState,
  values: ICreateForm,
  totalVestingDuration: number
): Promise<TransactionInstruction[]> => {
  if (!values.selectedToken || !wallet.publicKey) {
    return [];
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
    autopay: values.autopay,
  };

  const mint = new PublicKey(values.selectedToken.id);
  const tokenProgramId = (await connection.getAccountInfo(mint))?.owner;
  const recipientKey = new PublicKey(values.recipient);
  const { config, vault, vaultAta } = getPDAs(
    PROGRAM_ID,
    identifier,
    wallet.publicKey,
    mint
  );

  const configAccount = await Config.fromAccountAddress(connection, config);

  const creatorAta = getAssociatedTokenAddressSync(
    mint,
    new PublicKey(wallet.publicKey),
    false,
    tokenProgramId
  );

  const daoTreasuryAta = getAssociatedTokenAddressSync(
    mint,
    configAccount.daoTreasury,
    false,
    tokenProgramId
  );

  const createInstructionAccounts: CreateInstructionAccounts = {
    creator: wallet.publicKey,
    recipient: recipientKey,
    devTreasury: configAccount.devTreasury,
    daoTreasury: configAccount.daoTreasury,
    config,
    vault,
    vaultAta,
    daoTreasuryAta,
    creatorAta,
    mint,
    tokenProgram: tokenProgramId,
    associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
    systemProgram: SystemProgram.programId,
  };

  let instructions: TransactionInstruction[] = [];
  if (isNativeMint(mint)) {
    const associatedToken = getAssociatedTokenAddressSync(
      mint,
      wallet.publicKey,
      false,
      tokenProgramId,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    const ix = new Transaction().add(
      createAssociatedTokenAccountInstruction(
        wallet.publicKey,
        associatedToken,
        wallet.publicKey,
        mint,
        tokenProgramId,
        ASSOCIATED_TOKEN_PROGRAM_ID
      ),
      SystemProgram.transfer({
        fromPubkey: wallet.publicKey,
        toPubkey: associatedToken,
        lamports: Number(values.amountToBeVested) * LAMPORTS_PER_SOL,
      }),
      createSyncNativeInstruction(associatedToken, tokenProgramId)
    ).instructions;

    instructions = ix;
  }

  const createLockInstruction = createCreateInstruction(
    createInstructionAccounts,
    createInstructionArgs
  );

  instructions.push(createLockInstruction);

  return instructions;
};
