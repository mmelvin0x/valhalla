import { Cluster, Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";
import type { NextApiRequest, NextApiResponse } from "next";

// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { DasApiAssetList } from "@metaplex-foundation/digital-asset-standard-api";
import { NATIVE_MINT } from "@solana/spl-token";
import axios from "axios";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<DasApiAssetList | { error: string }>
) {
  try {
    const { owner } = req.query;
    const url = `${process.env.RPC_URL}/?api-key=${process.env.RPC_API_KEY}`;
    const { data } = await axios.post(url, {
      jsonrpc: "2.0",
      id: "my-id",
      method: "searchAssets",
      params: {
        ownerAddress: owner,
        tokenType: "fungible",
      },
    });

    await sleep(4000);

    const { data: wSol } = await axios.post(url, {
      jsonrpc: "2.0",
      id: "my-id",
      method: "getAsset",
      params: {
        id: NATIVE_MINT.toBase58(),
      },
    });

    const connection = new Connection(
      clusterApiUrl(process.env.NETWORK as Cluster),
      "confirmed"
    );
    const balance = await connection.getBalance(new PublicKey(owner as string));
    wSol.result.content.metadata.symbol = "SOL";
    wSol.result.content.links.image = "/sol.png";
    wSol.result.token_info.balance = balance;

    data.result.total += 1;
    data.result.items.unshift(wSol.result);

    return res.status(200).json(data.result);
  } catch (error) {
    return res
      .status(500)
      .json({ error: "There was an error fetching your wallet." });
  }
}
