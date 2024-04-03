import { IconLockCancel, IconSend, IconUserCancel } from "@tabler/icons-react";
import { ValhallaVault, getValhallaVaultByIdentifier } from "@valhalla/lib";

import { ICellRendererParams } from "ag-grid-community";
import { disburse as _disburse } from "@/src/instructions/disburse";
import { searchMyVaults } from "@/src/utils/search";
import { toast } from "react-toastify";
import { useMemo } from "react";
import useProgram from "@/src/hooks/useProgram";
import { useValhallaStore } from "@/src/stores/useValhallaStore";

const DisburseCellRenderer = (params: ICellRendererParams) => {
  const { connection, wallet } = useProgram();
  const { setMyVaults } = useValhallaStore();
  const vault: Partial<ValhallaVault> = useMemo(
    () => params.data,
    [params.data]
  );

  const disburse = async () => {
    if (!vault.identifier) return;

    const fullVault = await getValhallaVaultByIdentifier(
      connection,
      vault.identifier
    );

    await fullVault.populate(connection, fullVault);
    await _disburse(connection, fullVault, wallet);
    await getVaults();
  };

  const getVaults = async (search = "") => {
    if (!wallet.publicKey) return;

    try {
      const { created, recipient } = await searchMyVaults(
        connection,
        wallet.publicKey,
        search
      );

      setMyVaults({
        created,
        recipient,
      });
    } catch (e) {
      toast.error("Failed to fetch vesting schedules");
    }
  };

  if (!vault.canDisburse) {
    return (
      <div className="h-10 flex flex-col items-center justify-center">
        <IconLockCancel className="text-error" />
      </div>
    );
  }

  if (vault.autopay) {
    return (
      <div className="h-10 flex flex-col items-center justify-center">
        <IconUserCancel className="text-error" />
      </div>
    );
  }

  return (
    <div className="h-10 flex flex-col items-center justify-center">
      <button
        className="btn btn-outline btn-primary btn-sm btn-circle mt-1"
        onClick={disburse}
      >
        <IconSend />
      </button>
    </div>
  );
};

export default DisburseCellRenderer;
