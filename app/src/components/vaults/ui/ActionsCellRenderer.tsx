import Link from "next/link";

const ActionsCellRenderer = (params) => {
  return (
    <div className="flex items-center gap-2">
      <Link href={`/vaults/${params.data.identifier}`}>
        <button className="btn btn-info btn-xs">View</button>
      </Link>

      <button
        disabled={!params.data.canDisburse}
        className="btn btn-primary btn-xs"
      >
        Disburse
      </button>
    </div>
  );
};

export default ActionsCellRenderer;
