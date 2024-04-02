import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";

import { ColDef, GridOptions } from "ag-grid-community";
import { IconEyeSearch, IconLockPlus } from "@tabler/icons-react";
import { useEffect, useMemo, useState } from "react";

import { AgGridReact } from "ag-grid-react";
import ConnectWalletToContinue from "../components/ConnectWalletToContinue";
import DashboardStats from "../components/dashboard/DashboardStats";
import Head from "next/head";
import Link from "next/link";
import { SubType } from "../utils/interfaces";
import SubTypeTabs from "../components/dashboard/SubTypeTabs";
import { ValhallaVault } from "@valhalla/lib";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { columnDefs } from "../components/grid/grid-configs";
import { searchMyVaults } from "../utils/search";
import { toast } from "react-toastify";
import useProgram from "../utils/useProgram";
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

  if (!wallet?.publicKey) {
    return <ConnectWalletToContinue />;
  }

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
          <DashboardStats />

          <div className="card">
            <div className="card-body">
              <div className="card-title flex items-between">
                <span className="flex-1">Accounts</span>

                <div className="flex gap-2">
                  <Link href="/vaults/all" className="btn btn-sm btn-secondary">
                    <IconEyeSearch /> View all vaults
                  </Link>

                  <Link href="/create" className="btn btn-sm btn-primary">
                    <IconLockPlus /> Create a vault
                  </Link>
                </div>
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
