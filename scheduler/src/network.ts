import { Cluster, Connection, Keypair, clusterApiUrl } from "@solana/web3.js";

import { AnchorProvider } from "@coral-xyz/anchor/dist/cjs/provider";
import { ClockworkProvider } from "@clockwork-xyz/sdk";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";

const port = process.env.PORT ?? 3001;
const cronSchedule = process.env.CRON_SCHEDULE ?? "*/15 * * * *";
const network = (process.env.NETWORK ?? "devnet") as Cluster;
const payer = Keypair.fromSecretKey(
  bs58.decode(process.env.PAYER_SECRET_KEY || "")
);

const connection = new Connection(clusterApiUrl(network), "confirmed");

const provider = new AnchorProvider(
  connection,
  new NodeWallet(payer),
  AnchorProvider.defaultOptions()
);

const clockworkProvider = ClockworkProvider.fromAnchorProvider(provider);

export {
  connection,
  network,
  provider,
  clockworkProvider,
  payer,
  cronSchedule,
  port,
};
