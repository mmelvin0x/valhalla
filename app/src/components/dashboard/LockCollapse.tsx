import { LockAccount } from "models/types";
import { useMemo } from "react";
import { shortenAddress } from "utils/formatters";
import { FaCheckCircle, FaExclamationCircle } from "react-icons/fa";

export default function LockCollapse({
  index,
  lock,
  disburse,
  changeRecipient,
  cancel,
}: {
  index: number;
  lock: LockAccount;
  disburse: (lock: LockAccount) => Promise<void>;
  changeRecipient: (lock: LockAccount) => Promise<void>;
  cancel: (lock: LockAccount) => Promise<void>;
}) {
  const address = useMemo(() => shortenAddress(lock.id), [lock]);

  return (
    <div
      key={lock.id.toBase58()}
      tabIndex={index}
      className="collapse collapse-arrow border bg-base-100"
    >
      <div className="collapse-title font-bold">{address}</div>
      <div className="collapse-content">
        <div className="grid grid-cols-2 gap-4">
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
            <span>{lock.displayFunder}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold">Recipient</span>
            <span>{lock.displayRecipient}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold">Token</span>
            <span>{lock.displayTokenMint}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold">Amount</span>
            <span>{lock.displayLockBalance}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold">Start Date</span>
            <span>{lock.displayStartDate}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold">End Date</span>
            <span>{lock.displayVestingEndDate}</span>
          </div>
          {/* TODO: Need to track number of payouts to get this */}
          {/* <div className="flex flex-col">
            <span className="text-lg font-bold">Next Payout</span>
            <span>{lock.displayNextPayout}</span>
          </div> */}
          {lock.cliffPaymentAmountAsNumberPerDecimals > 0 && (
            <>
              <div className="flex flex-col">
                <span className="text-lg font-bold">Cliff Amount</span>
                <span>{lock.displayCliffAmount}</span>
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
            <span>{lock.displayCancelAuthority}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold">Change Recipient</span>
            <span>{lock.displayChangeRecipientAuthority}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
