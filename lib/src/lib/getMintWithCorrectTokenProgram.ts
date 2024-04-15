import { PublicKey, type Connection } from "@solana/web3.js";
import {
  Mint,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  getMint,
} from "@solana/spl-token";
import { Vault } from "./vesting";
import { ValhallaVault } from "./models";

export async function getMintWithCorrectTokenProgram(
  connection: Connection,
  vault: Partial<Vault | ValhallaVault>
): Promise<{ mint: Mint; tokenProgramId: PublicKey }> {
  try {
    const mint = new PublicKey(vault.mint || "");
    return {
      mint: await getMint(connection, mint),
      tokenProgramId: TOKEN_PROGRAM_ID,
    };
  } catch (error) {
    const mint = new PublicKey(vault.mint || "");
    return {
      mint: await getMint(connection, mint, undefined, TOKEN_2022_PROGRAM_ID),
      tokenProgramId: TOKEN_2022_PROGRAM_ID,
    };
  }
}
