import { useMemo, useState } from "react";

import { ExplorerLink } from "components/ui/ExplorerLink";
import { PublicKey } from "@solana/web3.js";
import { shortenSignature } from "utils/formatters";
import { useGetSignatures } from "utils/useGetSignatures";

export function AccountTransactions({ address }: { address: PublicKey }) {
  const query = useGetSignatures({ address });
  const [showAll, setShowAll] = useState(false);

  const items = useMemo(() => {
    if (showAll) return query.data;
    return query.data?.slice(0, 5);
  }, [query.data, showAll]);

  return (
    <div className="card">
      <div className="card-body">
        <div className="card-title">Transaction History</div>

        {query.isError && (
          <pre className="alert alert-error">
            Error: {query.error?.message.toString()}
          </pre>
        )}

        {query.isSuccess && (
          <div>
            {query.data.length === 0 ? (
              <div>No transactions found.</div>
            ) : (
              <table className="table bg-base-100">
                <thead>
                  <tr>
                    <th>Signature</th>
                    <th>Block Time</th>
                    <th className="text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {items?.map((item) => (
                    <tr key={item.signature}>
                      <th className="">
                        <ExplorerLink
                          address={`item.signature`}
                          label={shortenSignature(item.signature)}
                        />
                      </th>
                      <td>
                        {new Date((item.blockTime ?? 0) * 1000).toISOString()}
                      </td>
                      <td className="text-right">
                        {item.err ? (
                          <div
                            className="badge badge-error"
                            title={JSON.stringify(item.err)}
                          >
                            Failed
                          </div>
                        ) : (
                          <div className="badge badge-success">Success</div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {(query.data?.length ?? 0) > 5 && (
                    <tr>
                      <td colSpan={4} className="text-center">
                        <button
                          className="btn btn-xs btn-outline"
                          onClick={() => setShowAll(!showAll)}
                        >
                          {showAll ? "Show Less" : "Show All"}
                        </button>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
