import { Authority } from "program";
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
}
