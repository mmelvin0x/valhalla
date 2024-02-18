import BaseModel from "models/models";
import { PublicKey } from "@solana/web3.js";

export default function ActionButtons({
  lock,
  disburse,
  userKey,
  changeRecipient,
  cancel,
}: {
  lock: BaseModel;
  disburse: (lock: BaseModel) => Promise<void>;
  userKey: PublicKey;
  changeRecipient: (lock: BaseModel) => Promise<void>;
  cancel: (lock: BaseModel) => Promise<void>;
}) {
  return (
    <div className="flex flex-wrap gap-2 col-span-2">
      <button
        className="btn btn-sm btn-accent"
        disabled={!lock.canDisburse}
        onClick={() => disburse(lock)}
      >
        Disburse
      </button>
      <button
        className="btn btn-sm btn-secondary"
        disabled={!lock.canChangeRecipient(userKey)}
        onClick={() => changeRecipient(lock)}
      >
        Update
      </button>
      <button
        className="btn btn-sm btn-error"
        disabled={!lock.canCancel(userKey)}
        onClick={() => cancel(lock)}
      >
        Cancel
      </button>
    </div>
  );
}
