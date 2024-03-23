import { ICellRendererParams } from "ag-grid-community";
import { IconEyeSearch } from "@tabler/icons-react";
import Link from "next/link";

const ActionsCellRenderer = (params: ICellRendererParams) => {
  return (
    <Link href={`/vaults/${params.data.identifier}`}>
      <button className="btn btn-ghost btn-sm btn-circle">
        <IconEyeSearch className="text-info" />
      </button>
    </Link>
  );
};

export default ActionsCellRenderer;
