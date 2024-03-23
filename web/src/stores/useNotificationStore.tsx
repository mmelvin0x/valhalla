import { create } from "zustand";
import produce from "immer";

interface NotificationStore {
  notifications: Array<{
    type: string;
    message: string;
    description?: string;
    txid?: string;
  }>;
  set: (x: any) => void;
}

const useNotificationStore = create<NotificationStore>((set) => ({
  notifications: [],
  // @ts-ignore
  set: (fn) => set(produce(fn)),
}));

export default useNotificationStore;
