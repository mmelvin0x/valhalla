import { ValhallaConfig, ValhallaVault } from "@valhalla/lib";

import { ReactNode } from "react";
import { create } from "zustand";

interface TransactionModalConfig {
  type: "error" | "info" | "success";
  message: ReactNode;
}

interface ValhallaStore {
  config: ValhallaConfig | null;

  setConfig: (config: ValhallaConfig) => void;

  vaults: { created: Array<ValhallaVault>; recipient: Array<ValhallaVault> };
  allVaults: Array<ValhallaVault>;

  setMyVaults: (models: {
    created: Array<ValhallaVault>;
    recipient: Array<ValhallaVault>;
  }) => void;

  setAllVaults: (models: Array<ValhallaVault>) => void;

  transactionModalConfig: TransactionModalConfig | null;

  setTransactionModalConfig: (config: TransactionModalConfig) => void;
}

export const useValhallaStore = create<ValhallaStore>((set) => ({
  config: null,

  setConfig: (config: ValhallaConfig) => set({ config }),

  vaults: { created: [], recipient: [] },
  allVaults: [],

  setMyVaults: (models: {
    created: Array<ValhallaVault>;
    recipient: Array<ValhallaVault>;
  }) => set({ vaults: models }),

  setAllVaults: (models: Array<ValhallaVault>) => set({ allVaults: models }),

  transactionModalConfig: null,

  setTransactionModalConfig: (config: TransactionModalConfig) =>
    set({ transactionModalConfig: config }),
}));
