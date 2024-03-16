import BaseModel from "models/models";
import { create } from "zustand";

interface ValhallaStore {
  vaults: { created: Array<BaseModel>; recipient: Array<BaseModel> };

  setVaults: (models: {
    created: Array<BaseModel>;
    recipient: Array<BaseModel>;
  }) => void;
}

export const useValhallaStore = create<ValhallaStore>((set) => ({
  vaults: { created: [], recipient: [] },

  setVaults: (models: {
    created: Array<BaseModel>;
    recipient: Array<BaseModel>;
  }) => set({ vaults: models }),
}));
