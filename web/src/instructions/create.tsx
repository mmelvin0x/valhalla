import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  NATIVE_MINT,
  NATIVE_MINT_2022,
  createAssociatedTokenAccountInstruction,
  createSyncNativeInstruction,
  getAccount,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import {
  Config,
  CreateInstructionAccounts,
  CreateInstructionArgs,
  PROGRAM_ID,
  createCreateInstruction,
  getMintWithCorrectTokenProgram,
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

import BN from "bn.js";
import { FormikHelpers } from "formik";
import { ICreateForm } from "../utils/interfaces";
import { WalletContextState } from "@solana/wallet-adapter-react";
import { isPublicKey } from "@metaplex-foundation/umi";
import { randomBytes } from "crypto";
import { sendTransaction } from "../utils/sendTransaction";
import { toast } from "react-toastify";

export const createVault = async (
  connection: Connection,
  wallet: WalletContextState,
  values: ICreateForm[],
  helpers: FormikHelpers<ICreateForm>,
  totalVestingDuration: number,
  today: Date
): Promise<{ identifier: BN; txId: string }> => {
  const isValid = [];
  for (let i = 0; i < values.length; i++) {
    isValid.push(
      await vaultValid(connection, wallet, values[i], helpers, today)
    );
  }

  if (!isValid.every((val) => val)) {
    toast.error("There is an issue with the vaults. Please check the form.");
    return { identifier: new BN(0), txId: "" };
  }

  const identifier = new BN(randomBytes(8));
  let instructions: TransactionInstruction[] = [];

  try {
    for (const value of values) {
      const ix = await getInstructions(
        connection,
        wallet,
        value,
        totalVestingDuration,
        identifier
      );

      instructions = [...instructions, ...ix];
    }

    toast.info(`Tx 1/1: Creating vault`, { toastId: "create" });
    const txId = await sendTransaction(
      connection,
      wallet,
      instructions,
      "create"
    );

    return { identifier, txId };
  } catch (error) {
    console.error(error);
    toast.error("Error creating vault. Please try again.");
    return { identifier: new BN(0), txId: "" };
  }
};

const isNativeMint = (mint: PublicKey) => {
  return mint.equals(NATIVE_MINT) || mint.equals(NATIVE_MINT_2022);
};

const vaultValid = async (
  connection: Connection,
  wallet: WalletContextState,
  value: ICreateForm,
  helpers: FormikHelpers<ICreateForm>,
  today: Date
) => {
  if (!wallet.publicKey) return;

  if (!value.selectedToken) {
    helpers.setFieldError("selectedToken", "Token is required");
    return false;
  }

  if (value.vestingEndDate <= value.startDate) {
    helpers.setFieldError("vestingEndDate", "Invalid Date");
    return false;
  }

  if (!isPublicKey(value.recipient)) {
    helpers.setFieldError("recipient", "Invalid Address");
    return false;
  }

  let balance = 0;
  const { mint, tokenProgramId } = await getMintWithCorrectTokenProgram(
    connection,
    { mint: new PublicKey(value.selectedToken.id) }
  );

  if (isNativeMint(mint.address)) {
    balance =
      (await connection.getBalance(wallet.publicKey)) / LAMPORTS_PER_SOL;
  } else {
    const userAtaAddress = getAssociatedTokenAddressSync(
      new PublicKey(value.selectedToken.id),
      wallet.publicKey,
      false,
      tokenProgramId,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    const userAta = await getAccount(
      connection,
      userAtaAddress,
      "confirmed",
      tokenProgramId
    );

    balance = Number(userAta.amount / BigInt(10 ** mint.decimals));
  }

  if (+value.amountToBeVested > balance) {
    helpers.setFieldError("amountToBeVested", "Amount exceeds token balance");

    return false;
  }

  return true;
};

const getInstructions = async (
  connection: Connection,
  wallet: WalletContextState,
  values: ICreateForm,
  totalVestingDuration: number,
  identifier: BN
): Promise<TransactionInstruction[]> => {
  if (!values.selectedToken || !wallet.publicKey) {
    return [];
  }

  const createInstructionArgs: CreateInstructionArgs = {
    identifier,
    name: getNameArg(values.name),
    amountToBeVested: Number(values.amountToBeVested),
    totalVestingDuration: Math.round(Number(totalVestingDuration / 1000)),
    startDate: Math.round(new Date(values.startDate).getTime() / 1000),
    payoutInterval: Math.round(values.payoutInterval / 1000),
    cancelAuthority: +values.cancelAuthority,
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
