import { ValhallaVault } from "models/models";
import { create } from "zustand";

interface ValhallaStore {
  vaults: { created: Array<ValhallaVault>; recipient: Array<ValhallaVault> };
  allVaults: Array<ValhallaVault>;

  setMyVaults: (models: {
    created: Array<ValhallaVault>;
    recipient: Array<ValhallaVault>;
  }) => void;

  setAllVaults: (models: Array<ValhallaVault>) => void;
}

export const useValhallaStore = create<ValhallaStore>((set) => ({
  vaults: { created: [], recipient: [] },
  allVaults: [],

  setMyVaults: (models: {
    created: Array<ValhallaVault>;
    recipient: Array<ValhallaVault>;
  }) => set({ vaults: models }),

  setAllVaults: (models: Array<ValhallaVault>) => set({ allVaults: models }),
}));
