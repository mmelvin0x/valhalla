import ActionsCellRenderer from "../ui/ActionsCellRenderer";
import AutopayCellRenderer from "../ui/AutopayCellRenderer";
import { ColDef } from "ag-grid-community";
import ExplorerCellRenderer from "../ui/ExplorerCellRenderer";
import { SubType } from "utils/constants";

export const columnDefs = (tab: SubType): ColDef[] => [
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
    headerName: tab === SubType.Created ? "Recipient" : "Creator",
    field: tab === SubType.Created ? "recipient" : "creator",
    tooltipField: tab === SubType.Created ? "recipient" : "creator",
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
    headerName: "Actions",
    field: "",
    filter: false,
    pinned: "right",
    cellRenderer: ActionsCellRenderer,
  },
];
