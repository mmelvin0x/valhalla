import ActionsCellRenderer from "../ui/ActionsCellRenderer";
import { ColDef } from "ag-grid-community";
import ExplorerCellRenderer from "../ui/ExplorerCellRenderer";

export const columnDefs: ColDef[] = [
  {
    headerName: "Name",
    field: "name",
    filter: true,
    filterParams: {
      filterOptions: ["equals"],
      trimInput: true,
      debounceMs: 1000,
    },
  },
  {
    headerName: "Mint",
    field: "mint",
    cellRenderer: ExplorerCellRenderer,
  },
  {
    headerName: "Start Date",
    field: "startDate",
  },
  {
    headerName: "End Date",
    field: "endDate",
  },
  {
    headerName: "Next Payout",
    field: "nextPayoutDate",
  },
  {
    headerName: "Last Paid",
    field: "lastPaymentTimestamp",
  },
  {
    headerName: "Payout Interval",
    field: "payoutInterval",
  },
  {
    headerName: "Total Payouts",
    field: "totalNumberOfPayouts",
  },
  {
    headerName: "Payments Made",
    field: "numberOfPaymentsMade",
  },
  {
    headerName: "Cancel Authority",
    field: "cancelAuthority",
  },
  {
    headerName: "Actions",
    field: "",
    filter: false,
    pinned: "right",
    cellRenderer: ActionsCellRenderer,
  },
];
