import type { NextApiRequest, NextApiResponse } from "next";

// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { DasApiAsset } from "@metaplex-foundation/digital-asset-standard-api";
import axios from "axios";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<DasApiAsset | { error: string }>
) {
  try {
    const { mint } = req.query;
    const url = `${process.env.RPC_URL}/?api-key=${process.env.RPC_API_KEY}`;
    const { data } = await axios.post(url, {
      jsonrpc: "2.0",
      id: "my-id",
      method: "getAsset",
      params: {
        id: mint,
      },
    });

    return res.status(200).json(data.result);
  } catch (error: any) {
    return res.status(500).json({ error });
  }
}
