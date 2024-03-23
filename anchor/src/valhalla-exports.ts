// Here we export some useful types and functions for interacting with the Anchor program.
import { PublicKey } from "@solana/web3.js";
import type { Valhalla } from "../target/types/valhalla";
import { IDL as ValhallaIDL } from "../target/types/valhalla";

// Re-export the generated IDL and type
export { Valhalla, ValhallaIDL };

// After updating your program ID (e.g. after running `anchor keys sync`) update the value below.
export const programId = new PublicKey(
  "8eqnKMrBM7kk73d7U4UDVzn9SFX9o8nE1woX6x6nAkgP"
);
