import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createHarvestWithheldTokensToMintInstruction,
} from "@solana/spl-token";
import {
  CancelInstructionAccounts,
  ValhallaVault,
  createCancelInstruction,
} from "@valhalla/lib";

import { Connection } from "@solana/web3.js";
import { WalletContextState } from "@solana/wallet-adapter-react";
import { sendTransaction } from "../utils/sendTransaction";
import { toast } from "react-toastify";

export const cancel = async (
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
      toast.info("Tx 1/2: Harvesting withheld tokens to mint", {
        toastId: "cancel",
      });

      const instruction = createHarvestWithheldTokensToMintInstruction(
        vault.mint,
        [vault.vaultAta.address],
        vault.tokenProgramId
      );

      await sendTransaction(connection, wallet, [instruction], "cancel");
    } catch (e) {
      toast.error(`Error: ${(e as Error).message}`);
      console.error(e);
    }
  }

  const accounts: CancelInstructionAccounts = {
    signer: wallet.publicKey,
    creator: vault.creator,
    recipient: vault.recipient,
    vault: vault.key,
    vaultAta: vault.vaultAta.address,
    creatorAta: vault.creatorAta.address,
    mint: vault.mint,
    tokenProgram: vault.tokenProgramId,
    associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
  };

  const instructions = [createCancelInstruction(accounts)];

  toast.update("cancel", {
    type: "info",
    render: `Tx ${vault.isToken2022 ? "2/2" : "1/1"}: Cancelling vault`,
  });

  return await sendTransaction(connection, wallet, instructions, "cancel");
};
