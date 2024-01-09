import { PublicKey } from "@metaplex-foundation/js";
import {
  Account,
  ExtensionType,
  TOKEN_2022_PROGRAM_ID,
  createInitializeMintInstruction,
  createInitializeTransferFeeConfigInstruction,
  getMintLen,
  mintTo,
} from "@solana/spl-token";
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import { getTestTokenAccounts } from "./getTestTokenAccounts";

export async function mintTransferFeeTokens(
  connection: Connection,
  payer: Keypair,
  decimals: number,
  feeBasisPoints: number,
  maxFee: bigint,
  funder: Keypair,
  beneficiary: Keypair,
  amount: number
): Promise<[PublicKey, Account, Account]> {
  const mintKeypair = Keypair.generate();
  const mint = mintKeypair.publicKey;
  const mintLen = getMintLen([ExtensionType.TransferFeeConfig]);
  const mintLamports = await connection.getMinimumBalanceForRentExemption(
    mintLen
  );
  const mintTransaction = new Transaction().add(
    SystemProgram.createAccount({
      fromPubkey: payer.publicKey,
      newAccountPubkey: mint,
      space: mintLen,
      lamports: mintLamports,
      programId: TOKEN_2022_PROGRAM_ID,
    }),
    createInitializeTransferFeeConfigInstruction(
      mint,
      payer.publicKey,
      payer.publicKey,
      feeBasisPoints,
      maxFee,
      TOKEN_2022_PROGRAM_ID
    ),
    createInitializeMintInstruction(
      mint,
      decimals,
      payer.publicKey,
      null,
      TOKEN_2022_PROGRAM_ID
    )
  );

  const tx = await connection.sendTransaction(mintTransaction, [
    payer,
    mintKeypair,
  ]);
  await connection.confirmTransaction(tx);

  const [funderTokenAccount, beneficiaryTokenAccount] =
    await getTestTokenAccounts(
      connection,
      funder,
      beneficiary,
      mint,
      TOKEN_2022_PROGRAM_ID
    );

  await mintTo(
    connection,
    payer,
    mint,
    funderTokenAccount.address,
    payer,
    amount * LAMPORTS_PER_SOL,
    [],
    undefined,
    TOKEN_2022_PROGRAM_ID
  );

  return [mint, funderTokenAccount, beneficiaryTokenAccount];
}
