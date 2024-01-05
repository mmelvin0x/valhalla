// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import {
  DasApiAsset,
  DasApiAssetList,
} from "@metaplex-foundation/digital-asset-standard-api";
import axios from "axios";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<DasApiAssetList>
) {
  const { mints } = req.body;
  const url = `${process.env.RPC_URL}/?api-key=${process.env.RPC_API_KEY}`;
  const { data } = await axios.post(url, {
    jsonrpc: "2.0",
    id: "my-id",
    method: "getAssetBatch",
    params: { ids: mints },
  });

  return res.status(200).json(
    data.result
      .map((asset: DasApiAsset) =>
        asset?.id
          ? {
              id: asset.id,
              ...asset.content,
            }
          : null
      )
      .filter((asset: DasApiAsset | null) => !!asset)
  );
}
