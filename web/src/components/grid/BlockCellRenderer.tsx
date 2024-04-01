import { ICellRendererParams } from "ag-grid-community";
import Image from "next/image";
import Link from "next/link";
import { getExplorerUrl } from "@/src/utils/explorer";
import solscan from "../../assets/solscan.png";

const BlockCellRenderer = (params: ICellRendererParams) => {
  return (
    <Link
      className="link"
      href={getExplorerUrl(
        params.data?.connection?.rpcEndpoint,
        params.value,
        "block"
      )}
      rel="noopener"
      target="_blank"
    >
      <div className="flex items-center gap-2">
        {params.value}
        <Image src={solscan} width={20} height={20} alt="Solscan" />
      </div>
    </Link>
  );
};

export default BlockCellRenderer;
