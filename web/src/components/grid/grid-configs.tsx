import { ColDef, GridOptions } from "ag-grid-community";

import ActionsCellRenderer from "./ActionsCellRenderer";
import AutopayCellRenderer from "./AutopayCellRenderer";
import ExplorerCellRenderer from "./ExplorerCellRenderer";

export const vaultGridOptions = (): GridOptions => ({
  suppressMenuHide: true,
  unSortIcon: true,
  pagination: true,
  paginationPageSize: 50,
  paginationPageSizeSelector: false,
});

export const vaultDefaultColDef = (): ColDef => ({
  flex: 1,
  minWidth: 200,
  filter: true,
  sortable: true,
});

export const columnDefs = (): ColDef[] => [
  {
    headerName: "Name",
    field: "name",
    tooltipField: "name",
    filterParams: {
      trimInput: true,
      debounceMs: 1000,
    },
  },
  {
    headerName: "Autopay",
    field: "autopay",
    width: 135,
    minWidth: 135,
    maxWidth: 135,
    tooltipField: "autopay",
    cellRenderer: AutopayCellRenderer,
  },
  {
    headerName: "Mint",
    field: "mint",
    tooltipField: "mint",
    cellRenderer: ExplorerCellRenderer,
  },
  {
    headerName: "Start Date",
    field: "startDate",
    tooltipField: "startDate",
    valueFormatter: (params) => (params.value as Date).toLocaleString(),
  },
  {
    headerName: "End Date",
    field: "endDate",
    tooltipField: "endDate",
    valueFormatter: (params) => (params.value as Date).toLocaleString(),
  },
  {
    headerName: "Next Payout",
    field: "nextPayoutDate",
    tooltipField: "nextPayoutDate",
    valueFormatter: (params) => (params.value as Date).toLocaleString(),
  },
  {
    headerName: "Last Paid",
    field: "lastPaymentTimestamp",
    tooltipField: "lastPaymentTimestamp",
    valueFormatter: (params) => (params.value as Date).toLocaleString(),
  },
  {
    headerName: "Payout Interval",
    field: "payoutInterval",
    tooltipField: "payoutInterval",
  },
  {
    headerName: "Total Payouts",
    field: "totalNumberOfPayouts",
    tooltipField: "totalNumberOfPayouts",
  },
  {
    headerName: "Payments Made",
    field: "numberOfPaymentsMade",
    tooltipField: "numberOfPaymentsMade",
  },
  {
    headerName: "Cancel Authority",
    field: "cancelAuthority",
    tooltipField: "cancelAuthority",
  },
  {
    headerName: "Creator",
    field: "creator",
    tooltipField: "creator",
    cellRenderer: ExplorerCellRenderer,
  },
  {
    headerName: "Recipient",
    field: "recipient",
    tooltipField: "recipient",
    cellRenderer: ExplorerCellRenderer,
  },
  {
    headerName: "",
    field: "",
    filter: false,
    sortable: false,
    maxWidth: 70,
    width: 70,
    minWidth: 70,
    pinned: "right",
    cellRenderer: ActionsCellRenderer,
  },
];
