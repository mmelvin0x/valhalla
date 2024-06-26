import { useMemo, useState } from "react";

import AddressBadge from "../AddressBadge";
import { DasApiAsset } from "@metaplex-foundation/digital-asset-standard-api";
import { FormikContextType } from "formik";
import { ICreateForm } from "@/src/utils/interfaces";
import { IconCircleX } from "@tabler/icons-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

interface SelectTokenDialogProps {
  assets: (DasApiAsset & { token_info: any })[];
  formik: FormikContextType<ICreateForm>;
}

export default function SelectTokenDialog({
  assets,
  formik,
}: SelectTokenDialogProps) {
  const [search, setSearch] = useState<string>("");
  const [filteredAssets, setFilteredAssets] = useState<DasApiAsset[]>([]);

  const assetList = useMemo(() => {
    if (search.length > 0) {
      return filteredAssets;
    } else {
      return assets;
    }
  }, [search.length, filteredAssets, assets]);

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
  };

  const formatTokenBalance = (asset: DasApiAsset) => {
    // @ts-expect-error token_info exists
    const balance = asset.token_info?.balance;
    // @ts-expect-error token_info exists
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
            className="btn btn-circle btn-sm"
            onClick={() => onModalClose()}
          >
            <IconCircleX className="w-6 h-6" />
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
            {assetList?.length ? (
              assetList
                .filter((it) => it.id)
                .map((asset: DasApiAsset) => (
                  <li key={asset.id} className="cursor-pointer">
                    <form method="dialog">
                      {/* if there is a button in form, it will close the modal */}
                      <button
                        className="w-full grid grid-cols-6 gap-2 px-2 items-center rounded hover:bg-base-200"
                        onClick={() => {
                          formik.setFieldValue("selectedToken", asset);
                          onModalClose();
                        }}
                      >
                        <div className="avatar mx-auto">
                          <div className="rounded-full w-8 h-8">
                            {/* @ts-expect-error same */}
                            {asset.content.links?.image ? (
                              <>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  className="rounded-full"
                                  // @ts-expect-error same
                                  src={asset.content.links?.image}
                                  alt={""}
                                />
                              </>
                            ) : (
                              <>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  className="rounded-full"
                                  src={"/LP.png"}
                                  alt={""}
                                />
                              </>
                            )}
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
                          {/* @ts-expect-error same */}
                          {!!asset.token_info.price_info && (
                            <div>
                              {/* @ts-expect-error same */}
                              {asset.token_info.price_info.price_per_token}{" "}
                              {/* @ts-expect-error same */}
                              {asset.token_info.price_info.currency}
                            </div>
                          )}
                        </div>
                      </button>
                    </form>
                  </li>
                ))
            ) : (
              <div className="flex flex-col items-center justify-center gap-2 p-4">
                <p className="prose">Connect your wallet to get started!</p>
                <WalletMultiButton />
              </div>
            )}
          </ul>
        </div>
      </div>
    </dialog>
  );
}
