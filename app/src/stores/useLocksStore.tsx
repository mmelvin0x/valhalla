import { LockAccount } from "program/accounts";
import { create } from "zustand";

interface LocksStore {
  locks: LockAccount[];
  setLocks: (locks: LockAccount[]) => void;
  selectedLock: LockAccount | null;
  setSelectedLock: (lock: LockAccount | null) => void;
}

const useLocksStore = create<LocksStore>((set) => ({
  locks: [],
  setLocks: (locks: LockAccount[]) => set({ locks }),
  selectedLock: null,
  setSelectedLock: (lock: LockAccount | null) => set({ selectedLock: lock }),
}));

export default useLocksStore;
