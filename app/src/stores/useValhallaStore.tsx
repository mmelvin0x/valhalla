import BaseModel from "models/models";
import { create } from "zustand";

interface ValhallaStore {
  vestingSchedules: { created: Array<BaseModel>; recipient: Array<BaseModel> };
  scheduledPayments: { created: Array<BaseModel>; recipient: Array<BaseModel> };
  tokenLocks: { created: Array<BaseModel> };
  setVestingSchedules: (models: {
    created: Array<BaseModel>;
    recipient: Array<BaseModel>;
  }) => void;
  setScheduledPayments: (models: {
    created: Array<BaseModel>;
    recipient: Array<BaseModel>;
  }) => void;
  setTokenLocks: (models: { created: Array<BaseModel> }) => void;
}

export const useValhallaStore = create<ValhallaStore>((set) => ({
  vestingSchedules: { created: [], recipient: [] },
  scheduledPayments: { created: [], recipient: [] },
  tokenLocks: { created: [], recipient: [] },
  setVestingSchedules: (models: {
    created: Array<BaseModel>;
    recipient: Array<BaseModel>;
  }) => set({ vestingSchedules: models }),
  setScheduledPayments: (models: {
    created: Array<BaseModel>;
    recipient: Array<BaseModel>;
  }) => set({ scheduledPayments: models }),
  setTokenLocks: (models: { created: Array<BaseModel> }) =>
    set({ tokenLocks: models }),
}));
