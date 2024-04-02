import { IconCircleCheck, IconCircleX } from "@tabler/icons-react";

import ActionButtons from "../lock/ActionButtons";
import BalanceDisplay from "../lock/BalanceDisplay";
import CreatorDisplay from "../lock/CreatorDisplay";
import EndDateDisplay from "../lock/EndDateDisplay";
import { FormikContextType } from "formik";
import { ICreateForm } from "@/src/utils/interfaces";
import NextPayoutDateDisplay from "../lock/NextPayoutDateDisplay";
import RecipientDisplay from "../lock/RecipientDisplay";
import StartDateDisplay from "../lock/StartDateDisplay";
import TokenMintDisplay from "../lock/TokenMintDisplay";
import { ValhallaVault } from "@valhalla/lib";
import VestmentChart from "../VestmentChart";
import { useEffect } from "react";
import useProgram from "@/src/utils/useProgram";

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

  useEffect(() => {
    (async () => {
      await vault.populate(connection, vault);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section className="flex flex-col gap-8 p-4">
      <VestmentChart
        totalVestingDuration={vault.totalVestingDuration}
        amountToBeVested={vault.initialDeposit}
        payoutInterval={vault.payoutIntervalAsNumberInMS}
        startDate={vault.startDate}
        vestingEndDate={vault.endDate}
        formik={
          {
            values: vault,
          } as unknown as FormikContextType<ICreateForm>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
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
          <span className="text-lg font-bold flex">
            {vault.isToken2022 ? "Token 2022" : "SPL Token"}
          </span>
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
          <span className="text-lg font-bold">Cancel Authority</span>
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
    </section>
  );
}
