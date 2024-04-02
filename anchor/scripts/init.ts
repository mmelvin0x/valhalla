import * as anchor from "@coral-xyz/anchor";

import { IDL, Valhalla } from "../target/types/valhalla";
import {
  LAMPORTS_PER_SOL,
  PublicKey,
  SYSVAR_INSTRUCTIONS_PUBKEY,
  clusterApiUrl,
} from "@solana/web3.js";

import { MPL_TOKEN_METADATA_PROGRAM_ID } from "@metaplex-foundation/mpl-token-metadata";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { confirm } from "../tests/utils/utils";
import { getPDAs } from "../tests/utils/getPDAs";

const VALHALLA_PROGRAM_ID = new anchor.web3.PublicKey(
  "FuPeiYYSevDpgLjfVckWewukMrLWrkwYPaZfU1uwgnyX"
);

const devFee = new anchor.BN(0.05 * LAMPORTS_PER_SOL);
const autopayMultiplier = new anchor.BN(2);
const tokenFeeBasisPoints = new anchor.BN(50);
const governanceTokenAmount = new anchor.BN(0.1 * LAMPORTS_PER_SOL);
const tokenName = "Odin";
const tokenSymbol = "ODIN";
const tokenURI =
  "https://shdw-drive.genesysgo.net/FFGzTBpq8qvqipeLVPWTcqo1mszCFwA5tvN7ciaqyxBw/odin.json";
const tokenDecimals = 9;

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

  const { config } = await getPDAs(program.programId);

  console.log("🔐 Config:", config.toBase58());

  const governanceTokenMint = PublicKey.findProgramAddressSync(
    [Buffer.from("governance_token_mint")],
    program.programId
  )[0];

  const metadata = PublicKey.findProgramAddressSync(
    [
      Buffer.from("metadata"),
      new PublicKey(MPL_TOKEN_METADATA_PROGRAM_ID).toBuffer(),
      new PublicKey(governanceTokenMint).toBuffer(),
    ],
    new PublicKey(MPL_TOKEN_METADATA_PROGRAM_ID)
  )[0];

  const tx = await program.methods
    .createConfig(
      tokenName,
      tokenSymbol,
      tokenURI,
      tokenDecimals,
      devFee,
      autopayMultiplier,
      tokenFeeBasisPoints,
      governanceTokenAmount
    )
    .accounts({
      admin: wallet.publicKey,
      config,
      metadata,
      devTreasury: wallet.publicKey,
      daoTreasury: wallet.publicKey,
      governanceTokenMint,
      tokenProgram: TOKEN_PROGRAM_ID,
      sysvarInstruction: SYSVAR_INSTRUCTIONS_PUBKEY,
      tokenMetadataProgram: MPL_TOKEN_METADATA_PROGRAM_ID,
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
