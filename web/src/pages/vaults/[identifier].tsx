import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";

import * as anchor from "@coral-xyz/anchor";

import { ColDef, GridOptions } from "ag-grid-community";
import {
  ValhallaVault,
  getValhallaVaultByIdentifier,
  shortenAddress,
} from "@valhalla/lib";
import { useCallback, useEffect, useMemo, useState } from "react";

import { AgGridReact } from "ag-grid-react";
import BlockCellRenderer from "@/src/components/grid/BlockCellRenderer";
import ConnectWalletToContinue from "@/src/components/ConnectWalletToContinue";
import Link from "next/link";
import LoadingSpinner from "@/src/components/LoadingSpinner";
import LockDetails from "@/src/components/dashboard/LockDetails";
import { NextSeo } from "next-seo";
import SignatureCellRenderer from "@/src/components/grid/SignatureCellRenderer";
import { cancel as _cancel } from "@/src/instructions/cancel";
import { close as _close } from "@/src/instructions/close";
import { disburse as _disburse } from "@/src/instructions/disburse";
import { getExplorerUrl } from "@/src/utils/explorer";
import { useGetSignatures } from "@/src/hooks/useGetSignatures";
import useProgram from "@/src/hooks/useProgram";
import { useRouter } from "next/router";

export default function VaultDetailFeature() {
  const { connection, wallet, connected } = useProgram();
  const router = useRouter();
  const [, updateState] = useState<unknown>();
  const forceUpdate = useCallback(() => updateState({}), []);
  const [vault, setVault] = useState<ValhallaVault | null>(null);
  const history = useGetSignatures({ address: vault?.key });

  const rowData = useMemo(() => history.data, [history]);

  const colDefs: ColDef[] = [
    {
      headerName: "Signature",
      field: "signature",
      cellRenderer: SignatureCellRenderer,
    },
    {
      headerName: "Block Time",
      field: "blockTime",
      valueFormatter: (params) => new Date(params.value).toLocaleString(),
    },
    {
      headerName: "Slot",
      field: "slot",
      cellRenderer: BlockCellRenderer,
    },
    {
      headerName: "Status",
      field: "confirmationStatus",
    },
  ];

  const gridOptions: GridOptions = {
    suppressMenuHide: true,
    unSortIcon: true,
  };

  const defaultColDef: ColDef = {
    flex: 1,
    minWidth: 130,
    filter: false,
    sortable: false,
  };

  const disburse = async (vault: ValhallaVault) => {
    await _disburse(connection, vault, wallet);
    await getVault();
    await forceUpdate();
  };

  const cancel = async (vault: ValhallaVault) => {
    const txId = await _cancel(connection, vault, wallet);

    if (!txId) {
      await getVault();
    } else {
      router.push("/dashboard");
    }
  };

  const close = async (vault: ValhallaVault) => {
    const txId = await _close(connection, vault, wallet);

    if (!txId) {
      await getVault();
    } else {
      router.push("/dashboard");
    }
  };

  const getVault = async () => {
    if (router.query.identifier && wallet.publicKey) {
      const vault = await getValhallaVaultByIdentifier(
        connection,
        new anchor.BN(router.query.identifier as string)
      );

      if (!vault) {
        router.push("/dashboard");
      }

      await vault.populate(connection, vault);
      setVault(vault);
    }
  };

  useEffect(() => {
    getVault();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallet.publicKey, router.query.identifier]);

  return (
    <div className="m-8 mt-0">
      <NextSeo
        title="Vault Details"
        description="Token 2022 & SPL compatible token vesting on Solana. We incentivize token vesting by rewarding users with $ODIN when they disburse a vault. The $ODIN token serves as the governance token for Valhalla DAO. Get $ODIN - control Valhalla."
        canonical={`https://valhalla.so/vaults/${router.query.identifier}`}
      />

      {connected ? (
        <>
          <Link href="/dashboard" className="btn btn-sm btn-secondary my-8">
            Back to Dashboard
          </Link>

          <main className="grid grid-cols-1 gap-8">
            <section className="card">
              <div className="card-body">
                {vault ? (
                  <>
                    <div className="text-xl font-bold">
                      {vault.name} -{" "}
                      <Link
                        className="link link-primary"
                        href={getExplorerUrl(connection.rpcEndpoint, vault.key)}
                        rel="noopener norefferer"
                      >
                        {shortenAddress(vault.key)}
                      </Link>
                    </div>

                    <LockDetails
                      vault={vault}
                      disburse={disburse}
                      cancel={cancel}
                      close={close}
                    />

                    <span className="text-lg mt-4 font-bold">History</span>
                    <div className="h-[40vh] ag-theme-alpine">
                      <AgGridReact
                        gridOptions={gridOptions}
                        defaultColDef={defaultColDef}
                        columnDefs={colDefs}
                        rowData={rowData}
                      />
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-center">
                    <LoadingSpinner />
                  </div>
                )}
              </div>
            </section>
          </main>
        </>
      ) : (
        <ConnectWalletToContinue />
      )}
    </div>
  );
}
