import {
  CloseInstructionAccounts,
  ValhallaVault,
  createCloseInstruction,
} from "@valhalla/lib";

import { Connection } from "@solana/web3.js";
import { WalletContextState } from "@solana/wallet-adapter-react";
import { createHarvestWithheldTokensToMintInstruction } from "@solana/spl-token";
import { sendTransaction } from "../utils/sendTransaction";
import { toast } from "react-toastify";

export const close = async (
  connection: Connection,
  vault: ValhallaVault,
  wallet: WalletContextState
): Promise<string | undefined> => {
  if (
    !wallet.publicKey ||
    !vault.vaultAta ||
    !vault.tokenProgramId ||
    !vault.creatorAta
  ) {
    toast.error("Missing wallet or vault data");
    return;
  }

  if (vault.isToken2022) {
    try {
      toast.info("TX 1/2: Harvesting withheld tokens to mint", {
        toastId: "close",
      });

      const instruction = createHarvestWithheldTokensToMintInstruction(
        vault.mint,
        [vault.vaultAta.address],
        vault.tokenProgramId
      );

      await sendTransaction(connection, wallet, [instruction], "close");
    } catch (e) {
      toast.error(`Error: ${(e as Error).message}`);
      console.error(e);
    }
  }

  const accounts: CloseInstructionAccounts = {
    creator: vault.creator,
    vault: vault.key,
    vaultAta: vault.vaultAta.address,
    mint: vault.mint,
    tokenProgram: vault.tokenProgramId,
  };

  const instructions = [createCloseInstruction(accounts)];

  toast.update("close", {
    render: `Tx ${vault.isToken2022 ? "2/2" : "1/1"}: Closing vault`,
  });
  return await sendTransaction(connection, wallet, instructions, "close");
};
