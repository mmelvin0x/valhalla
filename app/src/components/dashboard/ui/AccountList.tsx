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
}: {
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
        />
      )}

      {vestingType === VestingType.ScheduledPayment && (
        <AccountListItem
          loading={loading}
          list={scheduledPayments}
          subType={subType}
          vestingType={vestingType}
        />
      )}

      {vestingType === VestingType.TokenLock && (
        <AccountListItem
          loading={loading}
          list={tokenLocks}
          subType={subType}
          vestingType={vestingType}
        />
      )}
    </div>
  );
}
