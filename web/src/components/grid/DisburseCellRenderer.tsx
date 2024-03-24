import { getVaultByIdentifier, searchMyVaults } from "@/src/utils/search";

import { ICellRendererParams } from "ag-grid-community";
import { IconCircleX } from "@tabler/icons-react";
import { ValhallaVault } from "@valhalla/lib";
import { disburse as _disburse } from "@/src/instructions/disburse";
import { toast } from "react-toastify";
import { useMemo } from "react";
import useProgram from "@/src/utils/useProgram";
import { useValhallaStore } from "@/src/stores/useValhallaStore";

const DisburseCellRenderer = (params: ICellRendererParams) => {
  const { connection, wallet } = useProgram();
  const { setMyVaults } = useValhallaStore();
  const vault: Partial<ValhallaVault> = useMemo(
    () => params.data,
    [params.data]
  );

  const disburse = async () => {
    const fullVault = await getVaultByIdentifier(connection, vault.identifier);
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

  return (
    <div className="h-10 flex flex-col items-center justify-center">
      {vault.canDisburse ? (
        <button className="btn btn-success btn-xs mt-1" onClick={disburse}>
          Disburse
        </button>
      ) : (
        <IconCircleX className="text-error" />
      )}
    </div>
  );
};

export default DisburseCellRenderer;
