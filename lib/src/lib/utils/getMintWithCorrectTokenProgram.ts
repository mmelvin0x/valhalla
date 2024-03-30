import { type Connection, type PublicKey } from "@solana/web3.js";
import {
  Mint,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  getMint,
} from "@solana/spl-token";
import { Vault } from "../program";
import { ValhallaVault } from "./models";

export async function getMintWithCorrectTokenProgram(
  connection: Connection,
  vault: Partial<Vault | ValhallaVault>
): Promise<{ mint: Mint; tokenProgramId: PublicKey }> {
  try {
    return {
      mint: await getMint(connection, vault.mint),
      tokenProgramId: TOKEN_PROGRAM_ID,
    };
  } catch (error) {
    return {
      mint: await getMint(
        connection,
        vault.mint,
        undefined,
        TOKEN_2022_PROGRAM_ID
      ),
      tokenProgramId: TOKEN_2022_PROGRAM_ID,
    };
  }
}