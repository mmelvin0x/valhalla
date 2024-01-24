import { useMemo, useState } from "react";

import { AccountTokenBalance } from "./AccountTokenBalance";
import { ExplorerLink } from "components/ui/ExplorerLink";
import { PublicKey } from "@solana/web3.js";
import { shortenAddress } from "utils/formatters";
import { useGetTokenAccounts } from "utils/useGetTokenAccounts";
import { useQueryClient } from "@tanstack/react-query";

export function AccountTokens({ address }: { address: PublicKey }) {
  const [showAll, setShowAll] = useState(false);
  const query = useGetTokenAccounts({ address });
  const client = useQueryClient();
  const items = useMemo(() => {
    if (showAll) return query.data;
    return query.data?.slice(0, 5);
  }, [query.data, showAll]);

  return (
    <div className="card">
      <div className="card-body">
        <div className="card-title">Token Accounts</div>

        {query.isError && (
          <pre className="alert alert-error">
            Error: {query.error?.message.toString()}
          </pre>
        )}

        {query.isSuccess && (
          <div>
            {query.data.length === 0 ? (
              <div>No token accounts found.</div>
            ) : (
              <table className="table bg-base-100">
                <thead>
                  <tr>
                    <th>Public Key</th>
                    <th>Mint</th>
                    <th className="text-right">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {items?.map(({ account, pubkey }) => (
                    <tr key={pubkey.toString()}>
                      <td>
                        <div className="flex space-x-2">
                          <span className="">
                            <ExplorerLink
                              label={shortenAddress(pubkey)}
                              address={pubkey.toString()}
                            />
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="flex space-x-2">
                          <span className="">
                            <ExplorerLink
                              label={shortenAddress(
                                account.data.parsed.info.mint,
                              )}
                              address={account.data.parsed.info.mint.toString()}
                            />
                          </span>
                        </div>
                      </td>
                      <td className="text-right">
                        <span className="">
                          <AccountTokenBalance address={pubkey} />
                        </span>
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
