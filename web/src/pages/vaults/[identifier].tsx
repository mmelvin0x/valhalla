import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";

import { ColDef, GridOptions } from "ag-grid-community";
import { ValhallaVault, shortenAddress } from "@valhalla/lib";
import { useEffect, useMemo, useState } from "react";

import { AgGridReact } from "ag-grid-react";
import BlockCellRenderer from "@/src/components/grid/BlockCellRenderer";
import Head from "next/head";
import Link from "next/link";
import LoadingSpinner from "@/src/components/LoadingSpinner";
import LockDetails from "@/src/components/dashboard/LockDetails";
import SignatureCellRenderer from "@/src/components/grid/SignatureCellRenderer";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { disburse as _disburse } from "@/src/instructions/disburse";
import { getExplorerUrl } from "@/src/utils/explorer";
import { getVaultByIdentifier } from "@/src/utils/search";
import { useGetSignatures } from "@/src/utils/useGetSignatures";
import useProgram from "@/src/utils/useProgram";
import { useRouter } from "next/router";

export default function VaultDetailFeature() {
  const { connection, wallet, connected } = useProgram();
  const router = useRouter();
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
    await _disburse(connection, wallet.publicKey!, vault, wallet);
  };

  const cancel = async (vault: ValhallaVault) => {};

  const close = async (vault: ValhallaVault) => {};

  const getVault = async () => {
    if (router.query.identifier && wallet.publicKey) {
      const vault = await getVaultByIdentifier(
        connection,
        router.query.identifier as string
      );

      await vault.populate(connection, vault);

      setVault(vault);
    }
  };

  useEffect(() => {
    getVault();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallet.publicKey, router.query.identifier]);

  return (
    <div className="m-8">
      <Head>
        <title>Valhalla | Token Vesting Solutions</title>
        <meta
          name="description"
          content="Token Vesting and Locks on Solana. Lock your tokens until Valhalla."
        />
      </Head>

      <main className="grid grid-cols-1 gap-8">
        <section className="card">
          {connected ? (
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

              <div className="card-actions justify-end">
                <Link href="/dashboard" className="btn btn-sm btn-info">
                  Back to Dashboard
                </Link>
              </div>
            </div>
          ) : (
            <div className="card-body items-center gap-4 p-8">
              <p className="prose">Connect your wallet to get started.</p>
              <WalletMultiButton />
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
