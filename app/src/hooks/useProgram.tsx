import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { LiquidityLocker, IDL } from "program/liquidity_locker";
import { useMemo } from "react";
import * as anchor from "@coral-xyz/anchor";
import { PROGRAM_ID } from "program";

const useProgram = () => {
  const wallet = useWallet();
  const { connection } = useConnection();
  const provider = new anchor.AnchorProvider(connection, wallet, {});
  const program = useMemo(
    () => new anchor.Program<LiquidityLocker>(IDL, PROGRAM_ID, provider),
    [wallet, connection, provider]
  );

  return { program, provider, wallet };
};

export default useProgram;
