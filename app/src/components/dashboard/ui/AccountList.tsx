import AccountListItem from "./AccountListItem";
import BaseModel from "models/models";
import { SubType } from "utils/constants";

export default function AccountList({
  loading,
  subType,
  vaults,
  disburse,
  cancel,
  close,
}: {
  close: (vault: BaseModel) => Promise<void>;
  disburse: (vault: BaseModel) => Promise<void>;
  cancel: (vault: BaseModel) => Promise<void>;
  loading: boolean;
  subType: SubType;
  vaults: { created: BaseModel[]; recipient: BaseModel[] };
}) {
  return (
    <div className="p-4 rounded min-h-[40vh] bg-base-100">
      <AccountListItem
        loading={loading}
        list={vaults}
        subType={subType}
        disburse={disburse}
        cancel={cancel}
        close={close}
      />
    </div>
  );
}
