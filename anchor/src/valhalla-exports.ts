import * as anchor from "@coral-xyz/anchor";

// Here we export some useful types and functions for interacting with the Anchor program.
import { PublicKey } from "@solana/web3.js";
import { Valhalla } from "../target/types/valhalla";

// After updating your program ID (e.g. after running `anchor keys sync`) update the value below.
export const programId = new PublicKey(
  "5AAFQF16iab69Zy2m2u9bSNBQRGWaByA7ZXAxaXeTTN4"
);

export const program = anchor.workspace.Valhalla as anchor.Program<Valhalla>;
