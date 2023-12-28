import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Valhalla, IDL } from "program/valhalla";
import { useMemo } from "react";
import * as anchor from "@coral-xyz/anchor";
import { PROGRAM_ID } from "program/accounts";

const useProgram = () => {
  const wallet = useWallet();
  const { connection } = useConnection();
  const provider = new anchor.AnchorProvider(connection, wallet, {});
  const program = useMemo(
    () => new anchor.Program<Valhalla>(IDL, PROGRAM_ID, provider),
    [wallet, connection, provider]
  );

  return { program, provider, wallet, connection };
};

export default useProgram;
