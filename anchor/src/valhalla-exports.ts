import * as anchor from "@coral-xyz/anchor";

// Here we export some useful types and functions for interacting with the Anchor program.
import { PublicKey } from "@solana/web3.js";
import { Vesting } from "../target/types/vesting";

// After updating your program ID (e.g. after running `anchor keys sync`) update the value below.
export const vestingProgramId = new PublicKey(
  "Ct63b5aLvhYT2bSvK3UG3oTJF8PgAC3MzDwpqXRKezF6"
);

export const vestingProgram = anchor.workspace
  .Vesting as anchor.Program<Vesting>;
