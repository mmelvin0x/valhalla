import { Cluster, Connection, Keypair, clusterApiUrl } from "@solana/web3.js";

const port = process.env.PORT ? Number(process.env.PORT) : 3001;
const network = (process.env.NETWORK ?? "devnet") as Cluster;
const cronSchedule = process.env.CRON_SCHEDULE ?? "*/15 * * * *";

const payer = Keypair.fromSecretKey(
  new Uint8Array(JSON.parse(process.env.PAYER_SECRET_KEY))
);

const connection = new Connection(clusterApiUrl(network), "confirmed");

export { connection, network, payer, port, cronSchedule };
