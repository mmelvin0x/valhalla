import {
  DisburseVestingScheduleInstructionAccounts,
  createDisburseScheduledPaymentInstruction,
  createDisburseTokenLockInstruction,
  createDisburseVestingScheduleInstruction,
} from "program";

import { ASSOCIATED_TOKEN_PROGRAM_ID } from "@solana/spl-token";
import BaseModel from "models/models";
import { PublicKey } from "@solana/web3.js";

export const disburseVestingScheduleInstruction = (
  userKey: PublicKey,
  lock: BaseModel,
) => {
  const accounts: DisburseVestingScheduleInstructionAccounts = {
    signer: userKey,
    creator: lock.creator,
    recipient: lock.recipient,
    vestingSchedule: lock.id,
    vestingScheduleTokenAccount: lock.tokenAccount.address,
    recipientTokenAccount: lock.recipientTokenAccount.address,
    mint: lock.tokenAccount.mint,
    tokenProgram: lock.tokenProgramId,
    associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
  };

  return createDisburseVestingScheduleInstruction(accounts);
};

export const disburseTokenLockInstruction = (lock: BaseModel) => {
  const accounts = {
    creator: lock.creator,
    creatorTokenAccount: lock.creatorTokenAccount.address,
    tokenLock: lock.id,
    tokenLockTokenAccount: lock.tokenAccount.address,
    mint: lock.tokenAccount.mint,
    tokenProgram: lock.tokenAccount.owner,
    associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
  };

  return createDisburseTokenLockInstruction(accounts);
};

export const disburseScheduledPaymentInstruction = (
  userKey: PublicKey,
  lock: BaseModel,
) => {
  const accounts = {
    signer: userKey,
    creator: lock.creator,
    recipient: lock.recipient,
    recipientTokenAccount: lock.recipientTokenAccount.address,
    scheduledPayment: lock.id,
    paymentTokenAccount: lock.tokenAccount.address,
    mint: lock.tokenAccount.mint,
    tokenProgram: lock.tokenAccount.owner,
    associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
  };

  return createDisburseScheduledPaymentInstruction(accounts);
};
