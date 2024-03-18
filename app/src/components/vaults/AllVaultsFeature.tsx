import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";

import {
  ColDef,
  FilterChangedEvent,
  GridOptions,
  GridReadyEvent,
  PaginationChangedEvent,
} from "ag-grid-community";

import { AgGridReact } from "ag-grid-react";
import Head from "next/head";
import { columnDefs } from "./utils/allVaultsColumnDefs";
import { searchAllVaults } from "utils/search";
import { useMemo } from "react";
import useProgram from "program/useProgram";
import { useValhallaStore } from "stores/useValhallaStore";

export default function AllVaultsFeature() {
  const { connection } = useProgram();
  const { allVaults, setAllVaults } = useValhallaStore();

  const gridOptions: GridOptions = {
    suppressMenuHide: true,
    unSortIcon: true,
    pagination: true,
    paginationPageSize: 50,
    paginationPageSizeSelector: false,
  };

  const defaultColDef: ColDef = {
    flex: 1,
    minWidth: 130,
    filter: false,
    sortable: false,
  };

  const colDefs = useMemo<ColDef[]>(() => columnDefs, []);

  const onSearch = async (
    event: GridReadyEvent | FilterChangedEvent | PaginationChangedEvent,
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
      mint,
    );
    console.log(
      "%c🤪 ~ file: AllVaultsFeature.tsx:71 [AllVaultsFeature/onSearch/vaults] -> vaults : ",
      "color: #43716c",
      vaults,
    );

    setAllVaults(vaults);
  };

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
            <div className="card-title">All Vaults</div>

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
