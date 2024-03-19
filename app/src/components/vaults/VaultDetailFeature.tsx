import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";

import { ColDef, GridOptions } from "ag-grid-community";
import { shortenAddress, shortenSignature } from "utils/formatters";
import { useEffect, useMemo, useState } from "react";

import { AgGridReact } from "ag-grid-react";
import BlockCellRenderer from "./ui/BlockCellRenderer";
import ExplorerCellRenderer from "./ui/ExplorerCellRenderer";
import Head from "next/head";
import Link from "next/link";
import LoadingSpinner from "components/ui/LoadingSpinner";
import LockDetails from "components/dashboard/ui/LockDetails";
import SignatureCellRenderer from "./ui/SignatureCellRenderer";
import { ValhallaVault } from "models/models";
import { disburse as _disburse } from "components/dashboard/instructions/disburse";
import { getExplorerUrl } from "utils/explorer";
import { getVaultByIdentifier } from "utils/search";
import { useGetSignatures } from "utils/useGetSignatures";
import useProgram from "program/useProgram";
import { useRouter } from "next/router";

export default function VaultDetailFeature() {
  const { connection, wallet, program } = useProgram();
  const router = useRouter();
  const [vault, setVault] = useState<ValhallaVault | null>(null);
  const history = useGetSignatures({ address: vault?.key });

  const rowData = useMemo(() => history.data, [history]);
  console.log(
    "%c🤪 ~ file: VaultDetailFeature.tsx:29 [VaultDetailFeature] -> rowData : ",
    "color: #38ffb6",
    rowData,
  );

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
    await _disburse(connection, wallet.publicKey, vault, wallet, program);
  };

  const cancel = async (vault: ValhallaVault) => {};

  const close = async (vault: ValhallaVault) => {};

  const getVault = async () => {
    if (router.query.identifier) {
      const vault = await getVaultByIdentifier(
        connection,
        router.query.identifier as string,
      );

      await vault.populate(connection, vault);

      setVault(vault);
    }
  };

  useEffect(() => {
    getVault();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
          <div className="card-body">
            {!!vault ? (
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
        </section>
      </main>
    </div>
  );
}
