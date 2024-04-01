import { Connection, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";

import create from "zustand";

interface UserSOLBalanceStore {
  balance: number;
  getUserSOLBalance: (publicKey: PublicKey, connection: Connection) => void;
}

const useUserSOLBalanceStore = create<UserSOLBalanceStore>((set, _get) => ({
  balance: 0,
  getUserSOLBalance: async (publicKey, connection) => {
    let balance = 0;
    try {
      balance = await connection.getBalance(publicKey, "confirmed");
      balance = balance / LAMPORTS_PER_SOL;
    } catch (e) {
      console.error(`error getting balance: `, e);
    }
    set((s) => {
      s.balance = balance;
      return s;
    });
  },
}));

export default useUserSOLBalanceStore;
