import Link from "next/link";
import LoadingSpinner from "components/ui/LoadingSpinner";
import LockCollapse from "./LockCollapse";
import { SubType } from "utils/constants";
import Vault from "models/models";

export default function AccountListItem({
  loading,
  subType,
  list,
  disburse,
  cancel,
  close,
}: {
  close: (vault: Vault) => Promise<void>;
  disburse: (vault: Vault) => Promise<void>;
  cancel: (vault: Vault) => Promise<void>;
  loading: boolean;
  subType: SubType;
  list: { created: Vault[]; recipient?: Vault[] };
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
            list.created.map((vault) => (
              <LockCollapse
                key={vault.key.toBase58()}
                vault={vault}
                disburse={disburse}
                cancel={cancel}
                close={close}
              />
            ))
          ) : (
            <div className="h-60 w-full flex flex-col items-center justify-center gap-4">
              <span className="text-center">
                You have not created any vaults yet.
              </span>
              <Link href={`/create`} className="btn btn-accent">
                Create One
              </Link>
            </div>
          )}
        </>
      )}

      {subType === SubType.Receivable && (
        <>
          {!!list.recipient?.length ? (
            list.recipient.map((vault) => (
              <LockCollapse
                key={vault.key.toBase58()}
                vault={vault}
                disburse={disburse}
                cancel={cancel}
                close={close}
              />
            ))
          ) : (
            <div className="h-60 w-full flex flex-col items-center justify-center">
              <span className="text-center">No receivable vaults.</span>
            </div>
          )}
        </>
      )}
    </ul>
  );
}
