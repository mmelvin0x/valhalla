import * as anchor from "@coral-xyz/anchor";

import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
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
  sleep,
} from "@valhalla/lib";
import {
  Connection,
  PublicKey,
  SystemProgram,
  TransactionInstruction,
} from "@solana/web3.js";

import { ICreateForm } from "../utils/interfaces";
import { Thread } from "@clockwork-xyz/sdk";
import { WalletContextState } from "@solana/wallet-adapter-react";
import axios from "axios";
import { isPublicKey } from "@metaplex-foundation/umi";
import { randomBytes } from "crypto";
import { sendTransaction } from "../utils/sendTransaction";
import { toast } from "react-toastify";

export const createVault = async (
  connection: Connection,
  wallet: WalletContextState,
  vaultsToCreate: ICreateForm[],
  totalVestingDuration: number
): Promise<{ txIds: string[] }> => {
  for (let i = 0; i < vaultsToCreate.length; i++) {
    const isValid = await vaultValid(
      connection,
      wallet,
      vaultsToCreate[i],
      vaultsToCreate
    );

    if (!isValid) {
      toast.error("There is an issue with the vault. Please check the form.");
      return { txIds: [] };
    }
  }

  const txIds = [];
  let instructions: TransactionInstruction[] = [];
  for (let i = 0; i < vaultsToCreate.length; i++) {
    const identifier = new anchor.BN(randomBytes(8));
    vaultsToCreate[i].identifier = identifier;
    const ix = await getInstructions(
      connection,
      wallet,
      vaultsToCreate[i],
      totalVestingDuration,
      identifier
    );

    instructions = [...instructions, ...ix];
  }

  const size = instructions.reduce(
    (acc, ix) => acc + ix.data.BYTES_PER_ELEMENT * ix.data.byteLength,
    0
  );

  if (size > 1232) {
    // TODO: Chunk and send transactions
    toast.error(
      "The transaction is too large. Please reduce the number of recipients to a maximum of 10."
    );
    return { txIds: [] };
  } else {
    console.log("instructions", instructions);
    toast.info(`Tx 1/1: Creating vault`, { toastId: "create" });
    const txId = await sendTransaction(
      connection,
      wallet,
      instructions,
      "create"
    );

    txIds.push(txId);

    for (let i = 0; i < vaultsToCreate.length; i++) {
      if (vaultsToCreate[i].autopay) {
        const { data } = await axios.post<Thread>(
          `${process.env.NEXT_PUBLIC_SCHEDULER_URL}/threads`,
          {
            identifier: vaultsToCreate[i].identifier?.toString(),
          }
        );

        await sleep(500);
        console.log("Thread", data);
      }
    }

    return { txIds };
  }
};

const vaultValid = async (
  connection: Connection,
  wallet: WalletContextState,
  value: ICreateForm,
  vaultsToCreate: ICreateForm[]
) => {
  if (!wallet.publicKey) return;

  if (!value.selectedToken) {
    toast.error("You have not selected a token!");
    return false;
  }

  if (new Date(value.vestingEndDate) <= new Date(value.startDate)) {
    toast.error("The vesting end date must be after the start date.");
    return false;
  }

  if (!isPublicKey(value.recipient)) {
    toast.error("The recipient address is not valid.");
    return false;
  }

  const { mint, tokenProgramId } = await getMintWithCorrectTokenProgram(
    connection,
    { mint: new PublicKey(value.selectedToken.id) }
  );

  const userAtaAddress = getAssociatedTokenAddressSync(
    new PublicKey(value.selectedToken.id),
    wallet.publicKey,
    false,
    tokenProgramId,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );
  console.log(
    "%c🤪 ~ file: create.tsx:146 [vaultValid/userAtaAddress] -> userAtaAddress : ",
    "color: #70221",
    userAtaAddress
  );

  const userAta = await getAccount(
    connection,
    userAtaAddress,
    "confirmed",
    tokenProgramId
  );
  console.log(
    "%c🤪 ~ file: create.tsx:154 [vaultValid/userAta] -> userAta : ",
    "color: #ca54f",
    userAta
  );

  const balance = Number(userAta.amount / BigInt(10 ** mint.decimals));
  const totalAmountVested = vaultsToCreate.reduce(
    (acc, vault) => acc + +vault.amountToBeVested,
    0
  );

  if (totalAmountVested > balance) {
    toast.error("You do not have enough tokens to create this account.");
    return false;
  }

  return true;
};

const getInstructions = async (
  connection: Connection,
  wallet: WalletContextState,
  values: ICreateForm,
  totalVestingDuration: number,
  identifier: anchor.BN
): Promise<TransactionInstruction[]> => {
  if (!values.selectedToken || !wallet.publicKey) {
    return [];
  }

  const createInstructionArgs: CreateInstructionArgs = {
    identifier,
    name: getNameArg(values.name),
    amountToBeVested: Number(values.amountToBeVested),
    totalVestingDuration: Math.ceil(Number(totalVestingDuration / 1000)),
    startDate: Math.ceil(new Date(values.startDate).getTime() / 1000),
    payoutInterval: Math.ceil(values.payoutInterval / 1000),
    cancelAuthority: +values.cancelAuthority,
    autopay: values.autopay,
  };

  const mint = new PublicKey(values.selectedToken.id);
  const tokenProgramId = (await connection.getAccountInfo(mint))?.owner;
  const recipient = new PublicKey(values.recipient);
  const { config, vault, vaultAta } = getPDAs(
    PROGRAM_ID,
    identifier,
    wallet.publicKey,
    mint
  );

  const { devTreasury, daoTreasury, governanceTokenMintKey } =
    await Config.fromAccountAddress(connection, config);

  const creatorAta = getAssociatedTokenAddressSync(
    mint,
    new PublicKey(wallet.publicKey),
    false,
    tokenProgramId
  );

  const creatorGovernanceAta = getAssociatedTokenAddressSync(
    governanceTokenMintKey,
    wallet.publicKey,
    false,
    TOKEN_PROGRAM_ID
  );

  const daoTreasuryAta = getAssociatedTokenAddressSync(
    mint,
    daoTreasury,
    false,
    tokenProgramId
  );

  const createInstructionAccounts: CreateInstructionAccounts = {
    creator: wallet.publicKey,
    recipient,
    devTreasury,
    daoTreasury,
    config,
    vault,
    vaultAta,
    daoTreasuryAta,
    creatorAta,
    mint,
    creatorGovernanceAta,
    governanceTokenMint: governanceTokenMintKey,
    tokenProgram: tokenProgramId,
    associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
    governanceTokenProgram: TOKEN_PROGRAM_ID,
    systemProgram: SystemProgram.programId,
  };

  return [
    createCreateInstruction(createInstructionAccounts, createInstructionArgs),
  ];
};
