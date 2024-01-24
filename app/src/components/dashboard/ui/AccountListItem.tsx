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
}: {
  loading: boolean;
  vestingType: VestingType;
  subType: SubType;
  list: { created: BaseModel[]; recipient?: BaseModel[] };
}) {
  return (
    <ul>
      {loading && (
        <div>
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
                vestingType={vestingType}
                disburse={async () => alert("Implement me")}
                changeRecipient={async () => alert("Implement me")}
                cancel={async () => alert("Implement me")}
              />
            ))
          ) : (
            <div className="h-60 w-full flex flex-col items-center justify-center">
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
                vestingType={vestingType}
                disburse={async () => alert("Implement me")}
                changeRecipient={async () => alert("Implement me")}
                cancel={async () => alert("Implement me")}
              />
            ))
          ) : (
            <div className="h-60 w-full flex flex-col items-center justify-center">
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
    </ul>
  );
}
