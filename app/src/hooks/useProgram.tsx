import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Valhalla, IDL } from "program/valhalla";
import { useEffect, useMemo, useState } from "react";
import * as anchor from "@coral-xyz/anchor";
import { PROGRAM_ID } from "program/accounts";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";

const useProgram = () => {
  const wallet = useWallet();
  const { connection } = useConnection();
  const [balance, setBalance] = useState<number>(0);
  const provider = new anchor.AnchorProvider(connection, wallet, {});
  const program = useMemo(
    () => new anchor.Program<Valhalla>(IDL, PROGRAM_ID, provider),
    [wallet, connection, provider]
  );

  const getBalance = async () => {
    if (!wallet?.publicKey) return 0;
    const balance = await connection.getBalance(wallet.publicKey);
    return balance / LAMPORTS_PER_SOL;
  };

  useEffect(() => {
    if (wallet?.publicKey) {
      getBalance().then(setBalance);
    }
  }, [wallet]);

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
