import { ICellRendererParams } from "ag-grid-community";
import { IconEyeSearch } from "@tabler/icons-react";
import Link from "next/link";
import { ValhallaVault } from "@valhalla/lib";

const ActionsCellRenderer = (params: ICellRendererParams<ValhallaVault>) => {
  return (
    <Link
      className="btn btn-outline btn-info btn-sm btn-circle mt-1"
      href={`/vaults/${params.data?.identifier}`}
    >
      <IconEyeSearch />
    </Link>
  );
};

export default ActionsCellRenderer;
