import * as anchor from "@coral-xyz/anchor";

import { IDL, Valhalla } from "../target/types/valhalla";
import { LAMPORTS_PER_SOL, PublicKey, clusterApiUrl } from "@solana/web3.js";

import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { confirm } from "../tests/utils/utils";
import { getPDAs } from "../tests/utils/getPDAs";

const VALHALLA_PROGRAM_ID = new anchor.web3.PublicKey(
  "4m91tz91kUVLg2Yv9MypJWysyg34RCmJziCaAoKQuuky"
);
const devFee = new anchor.BN(0.025 * LAMPORTS_PER_SOL);
const tokenFeeBasisPoints = new anchor.BN(10);
const governanceTokenAmount = new anchor.BN(10 * LAMPORTS_PER_SOL);

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

  const governanceTokenMint = PublicKey.findProgramAddressSync(
    [Buffer.from("governance_token_mint")],
    program.programId
  )[0];

  const tx = await program.methods
    .createConfig(devFee, tokenFeeBasisPoints, governanceTokenAmount)
    .accounts({
      admin: wallet.publicKey,
      config,
      devTreasury: wallet.publicKey,
      daoTreasury: wallet.publicKey,
      governanceTokenMint,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: anchor.web3.SystemProgram.programId,
    })
    .signers([wallet.payer])
    .rpc();

  const sig = await confirm(provider.connection, tx);

  console.log("✅ Initialization Transaction:", sig);

  const configAccount = await program.account.config.fetch(config);
  console.log("🐸 Admin:", configAccount.admin.toBase58());
  console.log("💰 SOL Treasury:", configAccount.devTreasury.toBase58());
  console.log("💰 Token Treasury::", configAccount.daoTreasury.toBase58());
  console.log(
    "🫡 Reward Mint:",
    configAccount.governanceTokenMintKey.toBase58()
  );
  console.log(
    "❤️‍🩹 SOL Fee:",
    configAccount.devFee.toNumber() / LAMPORTS_PER_SOL
  );
  console.log(
    "❤️‍🩹 Token Fee BPS:",
    configAccount.tokenFeeBasisPoints.toNumber()
  );
  console.log(
    "🪙 Reward Token Amount:",
    configAccount.governanceTokenAmount.toNumber()
  );
};

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
