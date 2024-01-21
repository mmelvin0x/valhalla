import * as anchor from "@coral-xyz/anchor";

import { IDL, Valhalla } from "../target/types/valhalla";
import { LAMPORTS_PER_SOL, clusterApiUrl } from "@solana/web3.js";

import { getPDAs } from "../tests/utils/constants";

const VALHALLA_PROGRAM_ID = new anchor.web3.PublicKey(
  "CpeQRExCTr7a6pzjF7mGsT6HZVpAM636xSUFC4STTJFn"
);

const FEE = 0.025;

const main = async () => {
  const wallet = anchor.Wallet.local();
  console.log("👨‍💻 Deployer:", wallet.publicKey.toBase58());

  const connection = new anchor.web3.Connection(
    clusterApiUrl("devnet"),
    "confirmed"
  );

  const provider = new anchor.AnchorProvider(connection, wallet, {});
  const program = new anchor.Program<Valhalla>(
    IDL,
    VALHALLA_PROGRAM_ID,
    provider
  );

  const { config } = await getPDAs(program.programId, null, null, null);

  console.log("🔐 Config:", config.toBase58());

  const initTx = await program.methods
    .adminInitialize(new anchor.BN(FEE * LAMPORTS_PER_SOL))
    .accounts({
      admin: wallet.publicKey,
      config: config,
      treasury: wallet.publicKey,
    })
    .signers([wallet.payer])
    .rpc();

  console.log("✅ Initialization Transaction:", initTx);

  await provider.connection.confirmTransaction(initTx, "confirmed");

  const configAccount = await program.account.config.fetch(config);
  console.log("🐸 Admin:", configAccount.admin.toBase58());
  console.log("💰 Treasury:", configAccount.treasury.toBase58());
  console.log("❤️‍🩹 Fee:", configAccount.fee.toNumber() / LAMPORTS_PER_SOL);
};

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
