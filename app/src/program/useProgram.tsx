import * as anchor from "@coral-xyz/anchor";

import { IDL, Valhalla } from "program/valhalla";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";

import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { PROGRAM_ID } from "program";

const useProgram = () => {
  const wallet = useWallet();
  const { connection } = useConnection();
  const [balance, setBalance] = useState<string>("0 ◎");
  const provider = useMemo(
    () => new anchor.AnchorProvider(connection, wallet, {}),
    [connection, wallet],
  );
  const program = useMemo(
    () => new anchor.Program<Valhalla>(IDL, PROGRAM_ID, provider),
    [provider],
  );

  const getBalance = useCallback(async () => {
    if (!wallet?.publicKey) return "0 ◎";
    const balance = await connection.getBalance(wallet.publicKey);
    return (balance / LAMPORTS_PER_SOL).toLocaleString() + " ◎";
  }, [connection, wallet?.publicKey]);

  useEffect(() => {
    if (wallet?.publicKey) {
      getBalance().then(setBalance);
    }
  }, [getBalance, wallet]);

  return {
    program,
    provider,
    wallet,
    connection,
    balance,
    connected: wallet.connected,
  };
};

export default useProgram;
