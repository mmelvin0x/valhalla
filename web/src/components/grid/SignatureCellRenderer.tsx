import { ICellRendererParams } from "ag-grid-community";
import Image from "next/image";
import Link from "next/link";
import { getExplorerUrl } from "@/src/utils/explorer";
import { shortenSignature } from "@valhalla/lib";
import solscan from "../../assets/solscan.png";

const SignatureCellRenderer = (params: ICellRendererParams) => {
  const value =
    typeof params.value === "string" && shortenSignature(params.value);

  return (
    <Link
      className="link"
      href={getExplorerUrl(
        params.data?.connection?.rpcEndpoint,
        params.value,
        "tx"
      )}
      rel="noopener"
      target="_blank"
    >
      <div className="flex items-center gap-2">
        {value}
        <Image src={solscan} width={20} height={20} alt="Solscan" />
      </div>
    </Link>
  );
};

export default SignatureCellRenderer;
