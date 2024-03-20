import { FaCheckCircle, FaCross, FaTimesCircle, FaXing } from "react-icons/fa";

import ActionButtons from "components/ui/lock/ActionButtons";
import BalanceDisplay from "components/ui/lock/BalanceDisplay";
import CreatorDisplay from "components/ui/lock/CreatorDisplay";
import EndDateDisplay from "components/ui/lock/EndDateDisplay";
import NextPayoutDateDisplay from "components/ui/lock/NextPayoutDateDisplay";
import PayoutIntervalDisplay from "components/ui/lock/PayoutIntervalDisplay";
import RecipientDisplay from "components/ui/lock/RecipientDisplay";
import StartDateDisplay from "components/ui/lock/StartDateDisplay";
import TokenMintDisplay from "components/ui/lock/TokenMintDisplay";
import { ValhallaVault } from "models/models";
import VestmentChart from "components/ui/VestmentChart";
import useProgram from "program/useProgram";

export default function LockDetails({
  vault,
  disburse,
  cancel,
  close,
}: {
  vault: ValhallaVault;
  disburse: (vault: ValhallaVault) => Promise<void>;
  cancel: (vault: ValhallaVault) => Promise<void>;
  close: (vault: ValhallaVault) => Promise<void>;
}) {
  const { wallet, connection } = useProgram();

  return (
    <section className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4">
      <div className="grid grid-cols-2 gap-4">
        <ActionButtons
          vault={vault}
          disburse={disburse}
          userKey={wallet.publicKey}
          cancel={cancel}
          close={close}
        />

        <div className="flex flex-col">
          <span className="text-lg font-bold">Lock Balance</span>
          <BalanceDisplay
            tokenAccount={vault.vaultAta}
            tokenAccountBalanceAsNumberPerDecimals={
              vault.vaultAtaBalanceAsNumberPerDecimals
            }
          />
        </div>

        <div className="flex flex-col">
          <span className="text-lg font-bold">Creator</span>
          <CreatorDisplay connection={connection} creator={vault.creator} />
        </div>

        <div className="flex flex-col">
          <span className="text-lg font-bold">Recipient</span>
          <RecipientDisplay
            recipient={vault.recipient}
            creator={vault.creator}
            connection={connection}
          />
        </div>

        <div className="flex flex-col">
          <span className="text-lg font-bold">Token</span>
          <TokenMintDisplay connection={connection} mint={vault.mint} />
        </div>

        <div className="flex flex-col">
          <span className="text-lg font-bold">Start Date</span>
          <StartDateDisplay startDate={vault.startDate} />
        </div>

        <div className="flex flex-col">
          <span className="text-lg font-bold">End Date</span>
          <EndDateDisplay
            startDate={vault.startDate}
            totalVestingDuration={vault.totalVestingDuration}
          />
        </div>

        <div className="flex flex-col">
          <span className="text-lg font-bold">Next Payout</span>
          <NextPayoutDateDisplay
            paymentsComplete={vault.paymentsComplete}
            nextPayoutDate={vault.nextPayoutDate}
          />
        </div>

        <div className="flex flex-col">
          <span className="text-lg font-bold">Payout Interval</span>
          <PayoutIntervalDisplay payoutInterval={vault.payoutInterval} />
        </div>

        <div className="flex flex-col">
          <span className="text-lg font-bold">Cancel</span>
          {vault.cancelAuthority}
        </div>

        <div className="flex flex-col">
          <span className="text-lg font-bold">Autopay?</span>
          {vault.autopay ? (
            <FaCheckCircle className="text-success w-6 h-6" />
          ) : (
            <FaTimesCircle className="text-error w-6 h-6" />
          )}
        </div>
      </div>

      <div className="flex flex-col col-span-2">
        <VestmentChart
          totalVestingDuration={vault.totalVestingDuration}
          amountToBeVested={vault.initialDeposit}
          payoutInterval={vault.payoutIntervalAsNumber}
          startDate={vault.startDate}
          vestingEndDate={vault.endDate}
          formik={{ values: vault }}
        />
      </div>
    </section>
  );
}
