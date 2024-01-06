import { DasApiAsset } from "@metaplex-foundation/digital-asset-standard-api";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Dispatch, SetStateAction, useMemo } from "react";
import { FaLock } from "react-icons/fa";

interface SelectTokenCardProps {
  depositAmount: number;
  selectedToken: DasApiAsset | null;
  setDepositAmount: Dispatch<SetStateAction<number>>;
  setSelectedToken: Dispatch<SetStateAction<DasApiAsset>>;
}

export default function SelectTokenCard({
  setSelectedToken,
  selectedToken,
  setDepositAmount,
  depositAmount,
}: SelectTokenCardProps) {
  const { connected } = useWallet();
  const balance = useMemo(
    () =>
      // @ts-ignore
      (selectedToken?.token_info.balance
        ? // @ts-ignore
          selectedToken?.token_info.balance /
          // @ts-ignore
          10 ** selectedToken?.token_info.decimals
        : 0
      ).toLocaleString(),
    [selectedToken]
  );

  return (
    <div className="card w-full">
      <div className="card-body">
        <div className="card-title">
          <FaLock /> Choose a token and an amount to lock
        </div>

        {connected ? (
          <button
            className="btn btn-block"
            onClick={() => {
              // @ts-ignore
              document.getElementById("select_token_modal").showModal();
              setSelectedToken(null);
              setDepositAmount(0);
            }}
          >
            {selectedToken?.id ? (
              <div className="flex items-center gap-2">
                <div className="">{depositAmount.toLocaleString()}</div>

                <div className="avatar">
                  <div className="rounded-full w-6 h-6">
                    <img
                      className="rounded-full avatar"
                      src={selectedToken?.content.links?.["image"] || "/LP.png"}
                      alt={""}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div>select token</div>
            )}
          </button>
        ) : (
          <div className="mx-auto">
            <WalletMultiButton className="block-multi-button" />
          </div>
        )}

        <div className="form-control">
          <div className="label flex justify-end">
            <div className="label-text-alt flex gap-2">
              <button
                className="btn btn-xs"
                onClick={() =>
                  setDepositAmount(
                    // @ts-ignore
                    selectedToken?.token_info.balance /
                      // @ts-ignore
                      10 ** selectedToken?.token_info.decimals /
                      2
                  )
                }
              >
                Half
              </button>
              <button
                className="btn btn-xs"
                onClick={() =>
                  setDepositAmount(
                    // @ts-ignore
                    selectedToken?.token_info.balance /
                      // @ts-ignore
                      10 ** selectedToken?.token_info.decimals
                  )
                }
              >
                Max
              </button>
            </div>
          </div>
          <input
            type="number"
            placeholder="Amount"
            className="input input-bordered"
            value={depositAmount}
            onChange={(e) => setDepositAmount(Number(e.target.value))}
          />
          <label className="label">
            <span className="label-text-alt"></span>
            <span className="label-text-alt">Balance: {balance}</span>
          </label>
        </div>
      </div>
    </div>
  );
}
