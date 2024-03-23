import { IconCircleCheck, IconCircleX } from "@tabler/icons-react";

import ActionButtons from "../lock/ActionButtons";
import BalanceDisplay from "../lock/BalanceDisplay";
import CreatorDisplay from "../lock/CreatorDisplay";
import EndDateDisplay from "../lock/EndDateDisplay";
import NextPayoutDateDisplay from "../lock/NextPayoutDateDisplay";
import RecipientDisplay from "../lock/RecipientDisplay";
import StartDateDisplay from "../lock/StartDateDisplay";
import TokenMintDisplay from "../lock/TokenMintDisplay";
import { ValhallaVault } from "@valhalla/lib";
import VestmentChart from "../VestmentChart";
import useProgram from "@/src/contexts/useProgram";

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
    <section className="grid grid-cols-12 gap-4 p-4">
      <div className="grid grid-cols-2 gap-4 col-span-5">
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
            vestingEndDate={
              vault.startDate.getTime() + vault.totalVestingDuration
            }
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
          {vault.payoutInterval}
        </div>

        <div className="flex flex-col">
          <span className="text-lg font-bold">Cancel</span>
          {vault.cancelAuthority}
        </div>

        <div className="flex flex-col">
          <span className="text-lg font-bold">Autopay?</span>
          {vault.autopay ? (
            <IconCircleCheck className="text-success w-6 h-6" />
          ) : (
            <IconCircleX className="text-error w-6 h-6" />
          )}
        </div>
      </div>

      <div className="flex flex-col col-span-7">
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
