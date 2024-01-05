import * as anchor from "@coral-xyz/anchor";
import { clusterApiUrl, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { IDL, Valhalla } from "../target/types/valhalla";
import { PROGRAM_ID } from "../api/src/program/accounts";

const main = async () => {
  const wallet = anchor.Wallet.local();
  console.log("-> ~ main ~ wallet:", wallet.publicKey.toBase58());
  const connection = new anchor.web3.Connection(
    clusterApiUrl("devnet"),
    "confirmed"
  );

  const provider = new anchor.AnchorProvider(connection, wallet, {});
  const program = new anchor.Program<Valhalla>(IDL, PROGRAM_ID, provider);

  const [locker] = await anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("locker")],
    program.programId
  );
  console.log("-> ~ main ~ locker:", locker.toBase58());

  const initTx = await program.methods
    .init(new anchor.BN(0.1 * LAMPORTS_PER_SOL))
    .accounts({
      admin: wallet.publicKey,
      locker: locker,
      treasury: wallet.publicKey,
    })
    .signers([wallet.payer])
    .rpc();

  console.log("-> ~ main ~ initTx:", initTx);

  await provider.connection.confirmTransaction(initTx, "confirmed");

  const lockerAccount = await program.account.locker.fetch(locker);
  console.log(
    "-> ~ main ~ lockerAccount.admin:",
    lockerAccount.admin.toBase58()
  );
  console.log(
    "-> ~ main ~ lockerAccount.treasury:",
    lockerAccount.treasury.toBase58()
  );
  console.log(
    "-> ~ main ~ lockerAccount.fee:",
    lockerAccount.fee.toNumber() / LAMPORTS_PER_SOL
  );
};

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
