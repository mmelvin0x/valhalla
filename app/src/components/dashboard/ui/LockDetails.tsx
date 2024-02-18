import * as anchor from "@coral-xyz/anchor";

import { FaCheckCircle, FaExclamationCircle } from "react-icons/fa";

import ActionButtons from "components/ui/lock/ActionButtons";
import BalanceDisplay from "components/ui/lock/BalanceDisplay";
import BaseModel from "models/models";
import CancelAuthorityDisplay from "components/ui/lock/CancelAuthorityDisplay";
import ChangeRecipientAuthorityDisplay from "components/ui/lock/ChangeRecipientAuthorityDisplay";
import CliffPaymentAmountDisplay from "components/ui/lock/CliffPaymentAmountDisplay";
import CreatorDisplay from "components/ui/lock/CreatorDisplay";
import EndDateDisplay from "components/ui/lock/EndDateDisplay";
import NextPayoutDateDisplay from "components/ui/lock/NextPayoutDateDisplay";
import PayoutIntervalDisplay from "components/ui/lock/PayoutIntervalDisplay";
import RecipientDisplay from "components/ui/lock/RecipientDisplay";
import StartDateDisplay from "components/ui/lock/StartDateDisplay";
import TokenMintDisplay from "components/ui/lock/TokenMintDisplay";
import useProgram from "program/useProgram";

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
  const { wallet, connection } = useProgram();

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 bg-base-200 rounded">
      <ActionButtons
        lock={lock}
        disburse={disburse}
        userKey={wallet.publicKey}
        changeRecipient={changeRecipient}
        cancel={cancel}
      />
      <div className="flex flex-col">
        <span className="text-lg font-bold">Lock Balance</span>
        <BalanceDisplay
          tokenAccount={lock.tokenAccount}
          tokenAccountBalanceAsNumberPerDecimals={
            lock.tokenAccountBalanceAsNumberPerDecimals
          }
        />
      </div>

      <div className="flex flex-col">
        <span className="text-lg font-bold">Creator</span>
        <CreatorDisplay connection={connection} creator={lock.creator} />
      </div>

      <div className="flex flex-col">
        <span className="text-lg font-bold">Recipient</span>
        <RecipientDisplay
          recipient={lock.recipient}
          creator={lock.creator}
          connection={connection}
        />
      </div>

      <div className="flex flex-col">
        <span className="text-lg font-bold">Token</span>
        <TokenMintDisplay connection={connection} mint={lock.mint} />
      </div>

      <div className="flex flex-col">
        <span className="text-lg font-bold">Start Date</span>
        <StartDateDisplay startDate={lock.startDate} />
      </div>

      <div className="flex flex-col">
        <span className="text-lg font-bold">End Date</span>
        <EndDateDisplay
          startDate={lock.startDate}
          totalVestingDuration={lock.totalVestingDuration}
        />
      </div>

      <div className="flex flex-col">
        <span className="text-lg font-bold">Next Payout</span>
        <NextPayoutDateDisplay
          paymentsComplete={lock.paymentsComplete}
          nextPayoutDate={lock.nextPayoutDate}
        />
      </div>

      <div className="flex flex-col">
        <span className="text-lg font-bold">Payout Interval</span>
        <PayoutIntervalDisplay payoutInterval={lock.payoutInterval} />
      </div>

      {lock.cliffPaymentAmount.gt(new anchor.BN(0)) && (
        <>
          <div className="flex flex-col">
            <span className="text-lg font-bold">Cliff Amount</span>
            <CliffPaymentAmountDisplay
              mintInfo={lock.mintInfo}
              cliffPaymentAmount={lock.cliffPaymentAmount}
            />
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
        <CancelAuthorityDisplay
          connection={connection}
          authority={lock.cancelAuthority}
          creator={lock.creator}
          recipient={lock.recipient}
        />
      </div>

      <div className="flex flex-col">
        <span className="text-lg font-bold">Change Recipient</span>
        <ChangeRecipientAuthorityDisplay
          connection={connection}
          authority={lock.changeRecipientAuthority}
          creator={lock.creator}
          recipient={lock.recipient}
        />
      </div>
    </div>
  );
}
