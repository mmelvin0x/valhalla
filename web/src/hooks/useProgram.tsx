import { useCallback, useEffect, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";

import { LAMPORTS_PER_SOL } from "@solana/web3.js";

const useProgram = () => {
  const wallet = useWallet();
  const { connection } = useConnection();
  const [balance, setBalance] = useState<string>("0 ◎");

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
    wallet,
    connection,
    balance,
    connected: wallet.connected,
  };
};

export default useProgram;
