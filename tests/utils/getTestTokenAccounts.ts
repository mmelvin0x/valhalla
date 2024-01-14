import { Account, getOrCreateAssociatedTokenAccount } from "@solana/spl-token";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";

export async function getTestTokenAccounts(
  connection: Connection,
  funder: Keypair,
  recipient: Keypair,
  mint: PublicKey,
  programId: PublicKey
): Promise<[Account, Account]> {
  const funderTokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    funder,
    mint,
    funder.publicKey,
    false,
    undefined,
    undefined,
    programId
  );

  const recipientTokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    recipient,
    mint,
    recipient.publicKey,
    false,
    undefined,
    undefined,
    programId
  );

  return [funderTokenAccount, recipientTokenAccount];
}
