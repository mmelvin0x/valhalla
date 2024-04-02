import { ColDef, GridOptions } from "ag-grid-community";

import ActionsCellRenderer from "./ActionsCellRenderer";
import AutopayCellRenderer from "./AutopayCellRenderer";
import DisburseCellRenderer from "./DisburseCellRenderer";
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
    cellRenderer: AutopayCellRenderer,
  },
  {
    headerName: "Disbursable",
    field: "canDisburse",
    width: 175,
    minWidth: 175,
    maxWidth: 175,
    tooltipValueGetter: (params) =>
      params.value && params.data.autopay
        ? "Disburses with autopay"
        : params.value && !params.data.autopay
        ? "Disbursable"
        : "Locked",
    cellRenderer: DisburseCellRenderer,
  },
  {
    headerName: "Mint",
    field: "mint",
    width: 135,
    minWidth: 135,
    maxWidth: 135,
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
    width: 175,
    minWidth: 175,
    maxWidth: 175,
    tooltipField: "payoutInterval",
  },
  {
    headerName: "Total Payouts",
    field: "totalNumberOfPayouts",
    width: 170,
    minWidth: 170,
    maxWidth: 170,
    tooltipField: "totalNumberOfPayouts",
  },
  {
    headerName: "Payments Made",
    field: "numberOfPaymentsMade",
    width: 180,
    minWidth: 180,
    maxWidth: 180,
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
    width: 135,
    minWidth: 135,
    maxWidth: 135,
    tooltipField: "creator",
    cellRenderer: ExplorerCellRenderer,
  },
  {
    headerName: "Recipient",
    field: "recipient",
    width: 135,
    minWidth: 135,
    maxWidth: 135,
    tooltipField: "recipient",
    cellRenderer: ExplorerCellRenderer,
  },
  {
    headerName: "Identifier",
    field: "identifier",
    width: 135,
    minWidth: 135,
    maxWidth: 135,
    tooltipField: "identifier",
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
