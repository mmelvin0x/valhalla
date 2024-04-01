import { Account, getOrCreateAssociatedTokenAccount } from "@solana/spl-token";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";

export async function getTestTokenAccounts(
  connection: Connection,
  creator: Keypair,
  recipient: Keypair,
  mint: PublicKey,
  programId: PublicKey
): Promise<[Account, Account]> {
  const creatorTokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    creator,
    mint,
    creator.publicKey,
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

  return [creatorTokenAccount, recipientTokenAccount];
}
