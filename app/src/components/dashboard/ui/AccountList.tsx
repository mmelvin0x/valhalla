import AccountListItem from "./AccountListItem";
import BaseModel from "models/models";
import { SubType } from "utils/constants";
import { VestingType } from "program";

export default function AccountList({
  loading,
  vestingType,
  subType,
  vestingSchedules,
  scheduledPayments,
  tokenLocks,
  disburse,
  changeRecipient,
  cancel,
  close,
}: {
  close: (lock: BaseModel) => Promise<void>;
  disburse: (lock: BaseModel) => Promise<void>;
  changeRecipient: (lock: BaseModel) => Promise<void>;
  cancel: (lock: BaseModel) => Promise<void>;
  loading: boolean;
  vestingType: VestingType;
  subType: SubType;
  vestingSchedules: { created: BaseModel[]; recipient: BaseModel[] };
  scheduledPayments: { created: BaseModel[]; recipient: BaseModel[] };
  tokenLocks: { created: BaseModel[] };
}) {
  return (
    <div className="p-4 rounded bg-base-100">
      {vestingType === VestingType.VestingSchedule && (
        <AccountListItem
          loading={loading}
          list={vestingSchedules}
          subType={subType}
          vestingType={vestingType}
          disburse={disburse}
          changeRecipient={changeRecipient}
          cancel={cancel}
          close={close}
        />
      )}

      {vestingType === VestingType.ScheduledPayment && (
        <AccountListItem
          loading={loading}
          list={scheduledPayments}
          subType={subType}
          vestingType={vestingType}
          disburse={disburse}
          changeRecipient={changeRecipient}
          cancel={cancel}
          close={close}
        />
      )}

      {vestingType === VestingType.TokenLock && (
        <AccountListItem
          loading={loading}
          list={tokenLocks}
          subType={subType}
          vestingType={vestingType}
          disburse={disburse}
          changeRecipient={changeRecipient}
          cancel={cancel}
          close={close}
        />
      )}
    </div>
  );
}
