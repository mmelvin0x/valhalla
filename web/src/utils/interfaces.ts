import { Authority } from "@valhalla/lib";
import { BN } from "@coral-xyz/anchor";
import { DasApiAsset } from "@metaplex-foundation/digital-asset-standard-api";

export interface ICreateForm {
  identifier?: BN;
  name: string;
  startDate: Date;
  vestingEndDate: Date;
  recipient: string;
  payoutInterval: number;
  selectedToken: (DasApiAsset & { token_info: any }) | null;
  amountToBeVested: string | number;
  cancelAuthority: Authority;
  autopay: boolean;
  startImmediately: boolean;
}

export enum SubType {
  Created,
  Receivable,
}
