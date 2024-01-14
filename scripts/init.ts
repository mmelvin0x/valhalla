import * as anchor from "@coral-xyz/anchor";
import { clusterApiUrl, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { IDL, Valhalla } from "../target/types/valhalla";

const VALHALLA_PROGRAM_ID = new anchor.web3.PublicKey(
  "BgfvN8xjwoBD8YDvpDAFPZW6QxJeqrEZWvoXGg21PVzU"
);

const FEE = 0.025;

const main = async () => {
  const wallet = anchor.Wallet.local();
  console.log("wallet:", wallet);

  const connection = new anchor.web3.Connection(
    clusterApiUrl("devnet"),
    "confirmed"
  );

  const provider = new anchor.AnchorProvider(connection, wallet, {});
  const program = new anchor.Program<Valhalla>(
    IDL,
    VALHALLA_PROGRAM_ID, // Pass the required argument to the function
    provider
  );

  const [locker] = await anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("locker")],
    program.programId
  );
  console.log("locker:", locker.toBase58());

  const initTx = await program.methods
    .adminInitialize(new anchor.BN(FEE * LAMPORTS_PER_SOL))
    .accounts({
      admin: wallet.publicKey,
      locker: locker,
      treasury: wallet.publicKey,
    })
    .signers([wallet.payer])
    .rpc();

  console.log("initTx:", initTx);

  await provider.connection.confirmTransaction(initTx, "confirmed");

  const lockerAccount = await program.account.locker.fetch(locker);
  console.log("lockerAccount.admin:", lockerAccount.admin.toBase58());
  console.log("lockerAccount.treasury:", lockerAccount.treasury.toBase58());
  console.log(
    "lockerAccount.fee:",
    lockerAccount.fee.toNumber() / LAMPORTS_PER_SOL
  );
};

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
