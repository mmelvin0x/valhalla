/**
 * This code was GENERATED using the solita package.
 * Please DO NOT EDIT THIS FILE, instead rerun solita to update it or write a wrapper to add functionality.
 *
 * See: https://github.com/metaplex-foundation/solita
 */

import * as beet from "@metaplex-foundation/beet";
import * as web3 from "@solana/web3.js";

/**
 * @category Instructions
 * @category UpdateGovernanceTokenAmount
 * @category generated
 */
export type UpdateGovernanceTokenAmountInstructionArgs = {
  governanceTokenAmount: beet.bignum;
};

/**
 * @category Instructions
 * @category UpdateGovernanceTokenAmount
 * @category generated
 */
export const updateGovernanceTokenAmountStruct = new beet.BeetArgsStruct<
  UpdateGovernanceTokenAmountInstructionArgs & {
    instructionDiscriminator: number[] /* size: 8 */;
  }
>(
  [
    ["instructionDiscriminator", beet.uniformFixedSizeArray(beet.u8, 8)],
    ["governanceTokenAmount", beet.u64],
  ],
  "UpdateGovernanceTokenAmountInstructionArgs"
);
/**
 * Accounts required by the _updateGovernanceTokenAmount_ instruction
 *
 * @property [_writable_, **signer**] admin
 * @property [_writable_] config
 * @category Instructions
 * @category UpdateGovernanceTokenAmount
 * @category generated
 */
export type UpdateGovernanceTokenAmountInstructionAccounts = {
  admin: web3.PublicKey;
  config: web3.PublicKey;
};

export const updateGovernanceTokenAmountInstructionDiscriminator = [
  87, 119, 105, 95, 233, 93, 222, 118,
];

/**
 * Creates a _UpdateGovernanceTokenAmount_ instruction.
 *
 * @param accounts that will be accessed while the instruction is processed
 * @param args to provide as instruction data to the program
 *
 * @category Instructions
 * @category UpdateGovernanceTokenAmount
 * @category generated
 */
export function createUpdateGovernanceTokenAmountInstruction(
  accounts: UpdateGovernanceTokenAmountInstructionAccounts,
  args: UpdateGovernanceTokenAmountInstructionArgs,
  programId = new web3.PublicKey("CaynZZxoLCM8zJjnrC1KGv3R4X2BCzaSynkVRSJgbLdC")
) {
  const [data] = updateGovernanceTokenAmountStruct.serialize({
    instructionDiscriminator:
      updateGovernanceTokenAmountInstructionDiscriminator,
    ...args,
  });
  const keys: web3.AccountMeta[] = [
    {
      pubkey: accounts.admin,
      isWritable: true,
      isSigner: true,
    },
    {
      pubkey: accounts.config,
      isWritable: true,
      isSigner: false,
    },
  ];

  const ix = new web3.TransactionInstruction({
    programId,
    keys,
    data,
  });
  return ix;
}
