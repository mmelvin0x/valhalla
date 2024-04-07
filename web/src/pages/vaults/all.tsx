import {
  ColDef,
  FilterChangedEvent,
  GridOptions,
  GridReadyEvent,
  PaginationChangedEvent,
} from "ag-grid-community";
import { IconDashboard, IconLockPlus } from "@tabler/icons-react";
import {
  columnDefs,
  vaultDefaultColDef,
  vaultGridOptions,
} from "@/src/components/grid/grid-configs";

import { AgGridReact } from "ag-grid-react";
import ConnectWalletToContinue from "@/src/components/ConnectWalletToContinue";
import Link from "next/link";
import { NextSeo } from "next-seo";
import { searchAllVaults } from "@/src/utils/search";
import { useMemo } from "react";
import useProgram from "@/src/hooks/useProgram";
import { useValhallaStore } from "@/src/stores/useValhallaStore";

export default function AllVaultsFeature() {
  const { connection, connected } = useProgram();
  const { allVaults, setAllVaults } = useValhallaStore();

  const colDefs = useMemo<ColDef[]>(() => columnDefs(), []);
  const defaultColDef = useMemo<ColDef>(() => vaultDefaultColDef(), []);
  const gridOptions = useMemo<GridOptions>(() => vaultGridOptions(), []);

  const onSearch = async (
    event: GridReadyEvent | FilterChangedEvent | PaginationChangedEvent
  ) => {
    const filters = event.api.getFilterModel();

    let name, creator, recipient, mint;
    if (filters.name) {
      name = filters.name.filter;
    }

    if (filters.creator) {
      creator = filters.creator.filter;
    }

    if (filters.recipient) {
      recipient = filters.recipient.filter;
    }

    if (filters.mint) {
      mint = filters.mint.filter;
    }

    const vaults = await searchAllVaults(
      connection,
      event.api.paginationGetCurrentPage(),
      event.api.paginationGetPageSize(),
      name,
      creator,
      recipient,
      mint
    );

    setAllVaults(vaults);
  };

  return (
    <div className="m-8">
      <NextSeo
        title="All Vaults"
        description="Token 2022 & SPL compatible token vesting on Solana. We incentivize token vesting by rewarding users with $ODIN when they disburse a vault. The $ODIN token serves as the governance token for Valhalla DAO. Get $ODIN - control Valhalla."
        canonical={`https://valhalla.so/vaults/all`}
      />

      {connected ? (
        <main className="grid grid-cols-1 gap-8">
          <section className="card">
            <div className="card-body">
              <div className="card-title flex items-between">
                <span className="flex-1">Accounts</span>

                <div className="flex gap-2">
                  <Link href="/vaults/all" className="btn btn-sm btn-secondary">
                    <IconDashboard /> Dashboard
                  </Link>

                  <Link
                    href="/vaults/create"
                    className="btn btn-sm btn-primary"
                  >
                    <IconLockPlus /> Create a vault
                  </Link>
                </div>
              </div>

              <div className="min-h-[80vh] ag-theme-quartz">
                <AgGridReact
                  gridOptions={gridOptions}
                  defaultColDef={defaultColDef}
                  columnDefs={colDefs}
                  rowData={allVaults}
                  onGridReady={onSearch}
                  onFilterChanged={onSearch}
                  onPaginationChanged={(event) => {
                    if (event.newData && event.newPage) {
                      onSearch(event);
                    }
                  }}
                />
              </div>
            </div>
          </section>
        </main>
      ) : (
        <ConnectWalletToContinue />
      )}
    </div>
  );
}
