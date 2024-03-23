import { ValhallaConfig, ValhallaVault } from "@valhalla/lib";

import { create } from "zustand";

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
}));
