import {
  AddressLookupTableAccount,
  ComputeBudgetProgram,
  Connection,
  PublicKey,
  RecentPrioritizationFees,
  Transaction,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";

export interface OptimizedTransactionResponse {
  transactions: VersionedTransaction[];
  recentBlockhash: Readonly<{
    blockhash: string;
    lastValidBlockHeight: number;
  }>;
}

/**
 * Builds optimal transactions by batching instructions into transactions and adding compute budget and priority fees
 * @param connection {Connection} The connection to the Solana cluster
 * @param instructions {TransactionInstruction[]} The instructions to be batched into transactions
 * @param signerKey {PublicKey} The public key of the signer
 * @param lookupTables {AddressLookupTableAccount[]} The lookup tables
 * @returns {Promise<OptimizedTransactionResponse>} The optimized transactions
 *
 * @see https://github.com/anselsol/solana-tx-packer/blob/main/src/index.ts#L6
 */
export async function buildOptimalTransactions(
  connection: Connection,
  instructions: TransactionInstruction[],
  signerKey: PublicKey,
  lookupTables: AddressLookupTableAccount[]
): Promise<OptimizedTransactionResponse> {
  // Add all instructions into as many transactions as needed
  const txs: Transaction[] = await batchInstructionsToTxsWithPriorityFee(
    connection,
    signerKey,
    instructions
  );

  const transactions: VersionedTransaction[] = [];

  const recentBlockhash = await connection.getLatestBlockhash();

  for (const tx of txs) {
    // Get CU budget and priority fee for each tx
    const [microLamportsEstimate, computeUnits] = await Promise.all([
      estimatePrioritizationFee(connection, tx.instructions, 100),
      getSimulationUnits(connection, tx.instructions, signerKey, lookupTables),
    ]);

    // console.log('Priority fees: ', microLamportsEstimate, ' / CUs: ', computeUnits);

    const instructions = [
      ComputeBudgetProgram.setComputeUnitLimit({
        units: computeUnits || 200_000,
      }),
      ComputeBudgetProgram.setComputeUnitPrice({
        microLamports: microLamportsEstimate,
      }),
      ...tx.instructions,
    ];

    transactions.push(
      new VersionedTransaction(
        new TransactionMessage({
          instructions,
          recentBlockhash: recentBlockhash.blockhash,
          payerKey: signerKey,
        }).compileToV0Message(lookupTables)
      )
    );
  }

  return {
    transactions,
    recentBlockhash,
  };
}

/**
 *
 * @param args {{ connection: Connection, computeUnits: number, instructions: TransactionInstruction[], basePriorityFee?: number}} The arguments
 * @returns {Promise<TransactionInstruction[]>} The instructions with compute budget and priority fees
 */
export async function withPriorityFees({
  connection,
  computeUnits,
  instructions,
  basePriorityFee,
}: {
  connection: Connection;
  computeUnits: number;
  instructions: TransactionInstruction[];
  basePriorityFee?: number;
}): Promise<TransactionInstruction[]> {
  const estimate = await estimatePrioritizationFee(
    connection,
    instructions,
    basePriorityFee
  );

  return [
    ComputeBudgetProgram.setComputeUnitLimit({
      units: computeUnits,
    }),
    ComputeBudgetProgram.setComputeUnitPrice({
      microLamports: estimate,
    }),
    ...instructions,
  ];
}

// https://github.com/blockworks-foundation/mango-v4/blob/57a9835aa8f636b6d231ba2c4008bfe89cbf08ba/ts/client/src/client.ts#L4552
async function estimatePrioritizationFee(
  connection: Connection,
  ixs: TransactionInstruction[],
  basePriorityFee?: number
): Promise<number> {
  const MAX_RECENT_PRIORITY_FEE_ACCOUNTS = 128;
  const writableAccounts = ixs
    .map((x) => x.keys.filter((a) => a.isWritable).map((k) => k.pubkey))
    .flat();
  const uniqueWritableAccounts = [
    ...new Set(writableAccounts.map((x) => x.toBase58())),
  ]
    .map((a) => new PublicKey(a))
    .slice(0, MAX_RECENT_PRIORITY_FEE_ACCOUNTS);

  const priorityFees = await connection.getRecentPrioritizationFees({
    lockedWritableAccounts: uniqueWritableAccounts,
  });

  if (priorityFees.length < 1) {
    return Math.max(basePriorityFee || 0, 1);
  }

  // get max priority fee per slot (and sort by slot from old to new)
  const groupedBySlot = priorityFees.reduce((acc, fee) => {
    const key = fee.slot;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(fee);
    return acc;
  }, {} as Record<string, RecentPrioritizationFees[]>);

  const maxFeeBySlot = Object.keys(groupedBySlot).reduce((acc, slot) => {
    acc[slot] = groupedBySlot[slot].reduce((max, fee) => {
      return fee.prioritizationFee > max.prioritizationFee ? fee : max;
    });
    return acc;
  }, {} as Record<string, RecentPrioritizationFees>);
  const maximumFees = Object.values(maxFeeBySlot).sort(
    (a: RecentPrioritizationFees, b: RecentPrioritizationFees) =>
      a.slot - b.slot
  ) as RecentPrioritizationFees[];

  // get median of last 20 fees
  const recentFees = maximumFees.slice(Math.max(maximumFees.length - 20, 0));
  const mid = Math.floor(recentFees.length / 2);
  const medianFee =
    recentFees.length % 2 !== 0
      ? recentFees[mid].prioritizationFee
      : (recentFees[mid - 1].prioritizationFee +
          recentFees[mid].prioritizationFee) /
        2;

  return Math.max(basePriorityFee || 1, Math.ceil(medianFee));
}

async function getSimulationUnits(
  connection: Connection,
  instructions: TransactionInstruction[],
  payer: PublicKey,
  lookupTables: AddressLookupTableAccount[],
  computeErrorMargin = 800
): Promise<number | undefined> {
  const testVersionedTxn = new VersionedTransaction(
    new TransactionMessage({
      instructions,
      payerKey: payer,
      recentBlockhash: PublicKey.default.toString(),
    }).compileToV0Message(lookupTables)
  );

  const simulation = await connection.simulateTransaction(testVersionedTxn, {
    replaceRecentBlockhash: true,
    sigVerify: false,
  });

  if (simulation.value.err) {
    return undefined;
  }

  if (!simulation.value.unitsConsumed) {
    return 200_000;
  }

  return simulation.value.unitsConsumed * (1 + computeErrorMargin / 10_000);
}

// https://github.com/helium/helium-program-library/blob/68da8e38e769a22bca0492156695b9677978d139/packages/spl-utils/src/transaction.ts#L766
async function batchInstructionsToTxsWithPriorityFee(
  connection: Connection,
  walletPubkey: PublicKey,
  instructions: TransactionInstruction[],
  {
    computeUnitLimit = 1000000,
    basePriorityFee,
  }: {
    computeUnitLimit?: number;
    basePriorityFee?: number;
  } = {}
): Promise<Transaction[]> {
  let currentTxInstructions: TransactionInstruction[] = [];
  const blockhash = (await connection.getLatestBlockhash()).blockhash;
  const transactions: Transaction[] = [];

  for (const instruction of instructions) {
    currentTxInstructions.push(instruction);
    const tx = new Transaction({
      feePayer: walletPubkey,
      recentBlockhash: blockhash,
    });
    tx.add(...currentTxInstructions);
    try {
      if (
        tx.serialize({
          requireAllSignatures: false,
          verifySignatures: false,
        }).length >=
        1232 - (64 + 32) * tx.signatures.length - 60 // 60 to leave room for compute budget stuff
      ) {
        // yes it's ugly to throw and catch, but .serialize can _also_ throw this error
        throw new Error("Transaction too large");
      }
    } catch (e) {
      if ((e as Error).toString().includes("Transaction too large")) {
        currentTxInstructions.pop();
        const tx = new Transaction({
          feePayer: walletPubkey,
          recentBlockhash: blockhash,
        });
        tx.add(
          ComputeBudgetProgram.setComputeUnitLimit({
            units: computeUnitLimit,
          }),
          ComputeBudgetProgram.setComputeUnitPrice({
            microLamports: await estimatePrioritizationFee(
              connection,
              currentTxInstructions,
              basePriorityFee
            ),
          }),
          ...currentTxInstructions
        );
        transactions.push(tx);
        currentTxInstructions = [instruction];
      } else {
        throw e;
      }
    }
  }

  if (currentTxInstructions.length > 0) {
    const tx = new Transaction({
      feePayer: walletPubkey,
      recentBlockhash: blockhash,
    });
    tx.add(
      ComputeBudgetProgram.setComputeUnitLimit({
        units: computeUnitLimit,
      }),
      ComputeBudgetProgram.setComputeUnitPrice({
        microLamports: await estimatePrioritizationFee(
          connection,
          currentTxInstructions,
          basePriorityFee
        ),
      }),
      ...currentTxInstructions
    );
    transactions.push(tx);
  }

  return transactions;
}
