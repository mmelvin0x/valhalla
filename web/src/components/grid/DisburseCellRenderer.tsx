import { IconLockCancel, IconSend } from "@tabler/icons-react";
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
      <button
        disabled
        className="btn btn-error btn-xs flex items-center gap-2 mt-2"
      >
        <IconLockCancel size={"1rem"} className="text-error" /> Locked
      </button>
    );
  }

  return (
    <button className="btn btn-accent btn-xs mt-2" onClick={disburse}>
      <IconSend size={"1rem"} /> Disburse
    </button>
  );
};

export default DisburseCellRenderer;
