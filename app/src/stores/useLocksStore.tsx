import { LockAccount } from "models/types";
import { create } from "zustand";

interface LocksStore {
  allLocks: LockAccount[];
  setAllLocks: (locks: LockAccount[]) => void;
  userFunderLocks: LockAccount[];
  setUserFunderLocks: (locks: LockAccount[]) => void;
  userRecipientLocks: LockAccount[];
  setUserRecipientLocks: (locks: LockAccount[]) => void;
  selectedLock: LockAccount | null;
  setSelectedLock: (lock: LockAccount | null) => void;
}

const useLocksStore = create<LocksStore>((set) => ({
  allLocks: [],
  setAllLocks: (allLocks: LockAccount[]) => set({ allLocks }),
  userFunderLocks: [],
  setUserFunderLocks: (userFunderLocks: LockAccount[]) =>
    set({ userFunderLocks }),
  userRecipientLocks: [],
  setUserRecipientLocks: (userRecipientLocks: LockAccount[]) =>
    set({ userRecipientLocks }),
  selectedLock: null,
  setSelectedLock: (lock: LockAccount | null) => set({ selectedLock: lock }),
}));

export default useLocksStore;
