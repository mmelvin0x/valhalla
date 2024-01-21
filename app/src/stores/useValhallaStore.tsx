import BaseModel from "models/models";
import { create } from "zustand";

interface ValhallaStore {
  vestingSchedules: { funded: Array<BaseModel>; recipient: Array<BaseModel> };
  scheduledPayments: { funded: Array<BaseModel>; recipient: Array<BaseModel> };
  tokenLocks: { funded: Array<BaseModel> };
  setVestingSchedules: (models: {
    funded: Array<BaseModel>;
    recipient: Array<BaseModel>;
  }) => void;
  setScheduledPayments: (models: {
    funded: Array<BaseModel>;
    recipient: Array<BaseModel>;
  }) => void;
  setTokenLocks: (models: { funded: Array<BaseModel> }) => void;
}

export const useValhallaStore = create<ValhallaStore>((set) => ({
  vestingSchedules: { funded: [], recipient: [] },
  scheduledPayments: { funded: [], recipient: [] },
  tokenLocks: { funded: [], recipient: [] },
  setVestingSchedules: (models: {
    funded: Array<BaseModel>;
    recipient: Array<BaseModel>;
  }) => set({ vestingSchedules: models }),
  setScheduledPayments: (models: {
    funded: Array<BaseModel>;
    recipient: Array<BaseModel>;
  }) => set({ scheduledPayments: models }),
  setTokenLocks: (models: { funded: Array<BaseModel> }) =>
    set({ tokenLocks: models }),
}));
