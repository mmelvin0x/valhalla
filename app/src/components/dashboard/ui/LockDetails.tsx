import { FaCheckCircle, FaExclamationCircle } from "react-icons/fa";

import BaseModel from "models/models";

export default function LockDetails({
  lock,
  disburse,
  changeRecipient,
  cancel,
}: {
  lock: BaseModel;
  disburse: (lock: BaseModel) => Promise<void>;
  changeRecipient: (lock: BaseModel) => Promise<void>;
  cancel: (lock: BaseModel) => Promise<void>;
}) {
  return (
    <div className="grid grid-cols-2 gap-4 p-2">
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
          disabled={!lock.canChangeRecipient}
          onClick={() => changeRecipient(lock)}
        >
          Update
        </button>
        <button
          className="btn btn-sm btn-error"
          disabled={!lock.canCancel}
          onClick={() => cancel(lock)}
        >
          Cancel
        </button>
      </div>
      <div className="flex flex-col">
        <span className="text-lg font-bold">Funder</span>
        <span>{lock.creatorDisplay}</span>
      </div>
      <div className="flex flex-col">
        <span className="text-lg font-bold">Recipient</span>
        <span>{lock.recipientDisplay}</span>
      </div>
      <div className="flex flex-col">
        <span className="text-lg font-bold">Token</span>
        <span>{lock.tokenMintDisplay}</span>
      </div>
      <div className="flex flex-col">
        <span className="text-lg font-bold">Amount</span>
        <span>{lock.balanceDisplay}</span>
      </div>
      <div className="flex flex-col">
        <span className="text-lg font-bold">Start Date</span>
        <span>{lock.startDateDisplay}</span>
      </div>
      <div className="flex flex-col">
        <span className="text-lg font-bold">End Date</span>
        <span>{lock.endDateDisplay}</span>
      </div>
      <div className="flex flex-col">
        <span className="text-lg font-bold">Next Payout</span>
        <span>{lock.nextPayoutDisplay}</span>
      </div>
      <div className="flex flex-col">
        <span className="text-lg font-bold">Payout Interval</span>
        <span>{lock.payoutIntervalDisplay}</span>
      </div>
      {lock.cliffPaymentAmount.toNumber() > 0 && (
        <>
          <div className="flex flex-col">
            <span className="text-lg font-bold">Cliff Amount</span>
            <span>{lock.cliffPaymentAmountDisplay}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold">Cliff Paid</span>
            <span>
              {lock.isCliffPaymentDisbursed ? (
                <span className="flex items-center text-success gap-2">
                  <FaCheckCircle size={20} /> Disbursed
                </span>
              ) : (
                <span className="flex items-center text-error gap-2">
                  <FaExclamationCircle size={20} /> Pending
                </span>
              )}
            </span>
          </div>
        </>
      )}
      <div className="flex flex-col">
        <span className="text-lg font-bold">Cancel</span>
        <span>{lock.cancelAuthorityDisplay}</span>
      </div>
      <div className="flex flex-col">
        <span className="text-lg font-bold">Change Recipient</span>
        <span>{lock.changeRecipientAuthorityDisplay}</span>
      </div>
    </div>
  );
}
