import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";

import {
  ColDef,
  FilterChangedEvent,
  GridOptions,
  GridReadyEvent,
  PaginationChangedEvent,
} from "ag-grid-community";
import {
  columnDefs,
  vaultDefaultColDef,
  vaultGridOptions,
} from "@/src/components/grid/grid-configs";

import { AgGridReact } from "ag-grid-react";
import Head from "next/head";
import Link from "next/link";
import { searchAllVaults } from "@/src/utils/search";
import { useMemo } from "react";
import useProgram from "@/src/utils/useProgram";
import { useValhallaStore } from "@/src/stores/useValhallaStore";

export default function AllVaultsFeature() {
  const { connection } = useProgram();
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
    <div className="m-8 mt-0">
      <Head>
        <title>Valhalla | Token Vesting Solutions</title>
        <meta
          name="description"
          content="Token Vesting and Locks on Solana. Lock your tokens until Valhalla."
        />
      </Head>

      <Link href="/dashboard" className="btn btn-sm btn-secondary mb-8">
        Back to Dashboard
      </Link>

      <main className="grid grid-cols-1 gap-8">
        <section className="card">
          <div className="card-body">
            <div className="card-title">All Vaults</div>

            <p className="prose">
              Search and filter through all of Valhalla&apos;s vaults
            </p>

            <div className="min-h-[80vh] ag-theme-alpine">
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
    </div>
  );
}
