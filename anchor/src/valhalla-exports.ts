import * as anchor from "@coral-xyz/anchor";

// Here we export some useful types and functions for interacting with the Anchor program.
import { PublicKey } from "@solana/web3.js";
import { Valhalla } from "../target/types/valhalla";

// After updating your program ID (e.g. after running `anchor keys sync`) update the value below.
export const programId = new PublicKey(
  "CaynZZxoLCM8zJjnrC1KGv3R4X2BCzaSynkVRSJgbLdC"
);

export const program = anchor.workspace.Valhalla as anchor.Program<Valhalla>;
