import BaseModel from "models/models";
import Link from "next/link";
import LoadingSpinner from "components/ui/LoadingSpinner";
import LockCollapse from "./LockCollapse";
import { SubType } from "utils/constants";
import { VestingType } from "program";

export default function AccountListItem({
  loading,
  vestingType,
  subType,
  list,
  disburse,
  changeRecipient,
  cancel,
}: {
  disburse: (lock: BaseModel) => Promise<void>;
  changeRecipient: (lock: BaseModel) => Promise<void>;
  cancel: (lock: BaseModel) => Promise<void>;
  loading: boolean;
  vestingType: VestingType;
  subType: SubType;
  list: { created: BaseModel[]; recipient?: BaseModel[] };
}) {
  return (
    <ul>
      {loading && (
        <div className="my-10 flex flex-col items-center">
          <LoadingSpinner />
        </div>
      )}
      {subType === SubType.Created && (
        <>
          {!!list.created.length ? (
            list.created.map((lock) => (
              <LockCollapse
                key={lock.id.toBase58()}
                lock={lock}
                disburse={disburse}
                changeRecipient={changeRecipient}
                cancel={cancel}
              />
            ))
          ) : (
            <div className="h-60 w-full flex flex-col items-center justify-center gap-4">
              <span className="text-center">
                You have not created any{" "}
                {vestingType === VestingType.VestingSchedule
                  ? "Vesting Schedules"
                  : vestingType === VestingType.TokenLock
                    ? "Token Locks"
                    : "Scheduled Payments"}
              </span>
              <Link
                href={`/create?vestingType=${vestingType}`}
                className="btn btn-accent"
              >
                Create One
              </Link>
            </div>
          )}
        </>
      )}

      {subType === SubType.Receivable && (
        <>
          {!!list.recipient?.length ? (
            list.recipient.map((lock) => (
              <LockCollapse
                key={lock.id.toBase58()}
                lock={lock}
                disburse={disburse}
                changeRecipient={changeRecipient}
                cancel={cancel}
              />
            ))
          ) : (
            <div className="h-60 w-full flex flex-col items-center justify-center">
              <span className="text-center">
                No Receivable{" "}
                {vestingType === VestingType.VestingSchedule
                  ? "Vesting Schedules"
                  : vestingType === VestingType.TokenLock
                    ? "Token Locks"
                    : "Scheduled Payments"}
              </span>
            </div>
          )}
        </>
      )}
    </ul>
  );
}
