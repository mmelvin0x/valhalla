import { ICellRendererParams } from "ag-grid-community";
import Image from "next/image";
import Link from "next/link";
import { getExplorerUrl } from "@/src/utils/explorer";
import { shortenAddress } from "@valhalla/lib";
import solscan from "../../assets/solscan.png";

const ExplorerCellRenderer = (params: ICellRendererParams) => {
  return (
    <Link
      className="link"
      href={getExplorerUrl(params.data?.connection?.rpcEndpoint, params.value)}
      rel="noopener"
      target="_blank"
    >
      <div className="flex items-center gap-2">
        {shortenAddress(params.value)}
        <Image src={solscan} width={20} height={20} alt="Solscan" />
      </div>
    </Link>
  );
};

export default ExplorerCellRenderer;
