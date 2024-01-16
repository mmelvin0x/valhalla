import { DasApiAsset } from "@metaplex-foundation/digital-asset-standard-api";
import AddressBadge from "components/ui/AddressBadge";
import { Dispatch, SetStateAction, useMemo, useState } from "react";
import { AiOutlineCloseCircle } from "react-icons/ai";

interface SelectTokenDialogProps {
  assets: DasApiAsset[];
  onTokenSelect: Dispatch<SetStateAction<DasApiAsset | null>>;
}

export default function SelectTokenDialog({
  assets,
  onTokenSelect,
}: SelectTokenDialogProps) {
  const [search, setSearch] = useState<string>("");
  const [filteredAssets, setFilteredAssets] = useState<DasApiAsset[]>([]);

  const assetList = useMemo(() => {
    if (search.length > 0) {
      return filteredAssets;
    } else {
      return assets;
    }
  }, [assets, filteredAssets, search.length]);

  const onSearch = (value: string) => {
    setSearch(value);
    const predicate = (it: DasApiAsset) =>
      it.id &&
      (it.content.metadata.symbol
        ?.toLowerCase()
        .includes(value.toLowerCase()) ||
        it.id.toLowerCase().includes(value.toLowerCase()) ||
        it.content.metadata.name?.toLowerCase().includes(value.toLowerCase()));
    setFilteredAssets(assets.filter(predicate));
  };

  const onModalClose = () => {
    setSearch("");
    setFilteredAssets([]);
    onTokenSelect(null);
  };

  const formatTokenBalance = (asset: DasApiAsset) => {
    // @ts-ignore
    const balance = asset.token_info?.balance;
    // @ts-ignore
    const decimals = 10 ** asset.token_info?.decimals;

    return balance && decimals ? (balance / decimals).toLocaleString() : 0;
  };

  return (
    <dialog
      id="select_token_modal"
      className="modal modal-bottom sm:modal-middle"
    >
      <div className="modal-box min-h-96 relative">
        <h3 className="">Select Token</h3>

        <form method="dialog" className="absolute top-0 right-0 m-1">
          {/* if there is a button in form, it will close the modal */}
          <button
            className="btn btn-circle btn-xs btn-ghost"
            onClick={() => onModalClose()}
          >
            <AiOutlineCloseCircle className="w-6 h-6 hover:text-white" />
          </button>
        </form>

        <div className="flex flex-col">
          <div className="form-control">
            <input
              type="text"
              placeholder="Search"
              className="input input-bordered"
              value={search}
              onChange={(e) => onSearch(e.target.value)}
            />
          </div>

          <hr className="my-2" />

          <div className="flex items-center justify-between gap-4 px-2">
            <span className="font-bold">Token</span>
            <span className="font-bold">Balance</span>
          </div>

          <hr className="my-2" />

          <ul className="p-2 flex flex-col overflow-y-scroll">
            {assetList
              .filter((it) => it.id)
              .map((asset: DasApiAsset) => (
                <li key={asset.id} className="cursor-pointer">
                  <form method="dialog">
                    {/* if there is a button in form, it will close the modal */}
                    <button
                      className="w-full grid grid-cols-6 gap-2 px-2 items-center rounded hover:bg-base-200"
                      onClick={() => {
                        onModalClose();
                        onTokenSelect(asset);
                      }}
                    >
                      <div className="avatar mx-auto">
                        <div className="rounded-full w-8 h-8">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            className="rounded-full avatar"
                            src={asset.content.links?.["image"] || "/LP.png"}
                            alt={""}
                          />
                        </div>
                      </div>
                      <div className="flex flex-col w-full p-2 col-span-3">
                        <div className="flex items-center gap-1">
                          <span className="font-bold">
                            {asset.content.metadata.symbol || "Unknown"}
                          </span>
                          <AddressBadge address={asset.id} />
                        </div>
                        <span className="text-xs self-start">
                          {asset.content.metadata.name || "Unknown"}
                        </span>
                      </div>

                      <div className="flex-end col-span-2 text-right text-xs">
                        <div>
                          <span>{formatTokenBalance(asset)}</span>
                        </div>
                        {/* @ts-ignore */}
                        {!!asset.token_info.price_info && (
                          <div>
                            {/* @ts-ignore */}
                            {asset.token_info.price_info.price_per_token}{" "}
                            {/* @ts-ignore */}
                            {asset.token_info.price_info.currency}
                          </div>
                        )}
                      </div>
                    </button>
                  </form>
                </li>
              ))}
          </ul>
        </div>
      </div>
    </dialog>
  );
}
