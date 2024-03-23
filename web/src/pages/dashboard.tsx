import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";

import { ColDef, GridOptions } from "ag-grid-community";
import { useEffect, useMemo, useState } from "react";

import { AgGridReact } from "ag-grid-react";
import DashboardStats from "../components/dashboard/DashboardStats";
import { Head } from "next/document";
import { SubType } from "../utils/interfaces";
import SubTypeTabs from "../components/dashboard/SubTypeTabs";
import { ValhallaVault } from "@valhalla/lib";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { columnDefs } from "../components/grid/grid-configs";
import { notify } from "../utils/notifications";
import { searchMyVaults } from "../utils/search";
import useProgram from "../contexts/useProgram";
import { useValhallaStore } from "../stores/useValhallaStore";

export default function DashboardFeature() {
  const { wallet, connection } = useProgram();
  const { vaults, setMyVaults } = useValhallaStore();

  const [currentList, setCurrentList] = useState<{
    created: ValhallaVault[];
    recipient: ValhallaVault[];
  }>({ created: [], recipient: [] });
  const [subType, setSubType] = useState<SubType>(SubType.Created);

  const gridOptions: GridOptions = {
    suppressMenuHide: true,
    unSortIcon: true,
    pagination: true,
    paginationPageSize: 50,
    paginationPageSizeSelector: false,
  };

  const defaultColDef: ColDef = {
    flex: 1,
    minWidth: 200,
    filter: true,
    sortable: true,
  };

  const colDefs = useMemo<ColDef[]>(() => columnDefs(), []);

  const disburseMany = async () => {
    alert("Disburse Many: Implement me!");
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
      notify({
        message: "Error",
        description: "Failed to fetch vesting schedules",
        type: "error",
      });
    }
  };

  // Grabs the locks for the user
  // TODO: Add dataslice for paging
  useEffect(() => {
    if (!wallet.publicKey) return;
    getVaults();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallet.publicKey]);

  // Sets the current list based on the vesting type
  useEffect(() => {
    setCurrentList({
      created: vaults.created,
      recipient: vaults.recipient,
    });
  }, [subType, vaults.created, vaults.recipient]);

  return (
    <>
      <Head>
        <title>Valhalla | Token Vesting Solutions</title>
        <meta
          name="description"
          content="Token Vesting and Locks on Solana. Lock your tokens until Valhalla."
        />
      </Head>

      {wallet.connected ? (
        <main className="grid grid-cols-1 gap-8 m-8">
          <DashboardStats disburseMany={disburseMany} />

          <div className="card">
            <div className="card-body">
              <div className="card-title">
                <span className="flex-1">Accounts</span>
              </div>

              <SubTypeTabs
                subType={subType}
                setSubType={setSubType}
                list={currentList}
              />

              <div className="min-h-[60vh] ag-theme-alpine">
                {subType === SubType.Created ? (
                  <AgGridReact
                    gridOptions={gridOptions}
                    defaultColDef={defaultColDef}
                    columnDefs={colDefs}
                    rowData={currentList.created}
                  />
                ) : (
                  <AgGridReact
                    gridOptions={gridOptions}
                    defaultColDef={defaultColDef}
                    columnDefs={colDefs}
                    rowData={currentList.recipient}
                  />
                )}
              </div>
            </div>
          </div>
        </main>
      ) : (
        <main className="flex flex-col items-center gap-4 m-8">
          <p className="prose">Connect your wallet to get started</p>
          <WalletMultiButton />
        </main>
      )}
    </>
  );
}
