import { Authority } from "@valhalla/lib";
import { DasApiAsset } from "@metaplex-foundation/digital-asset-standard-api";

export interface ICreateForm {
  name: string;
  startDate: Date;
  vestingEndDate: Date;
  recipient: string;
  payoutInterval: number;
  selectedToken: DasApiAsset | null;
  amountToBeVested: string | number;
  cancelAuthority: Authority;
  autopay: boolean;
  startImmediately: boolean;
}

export enum SubType {
  Created,
  Receivable,
}
