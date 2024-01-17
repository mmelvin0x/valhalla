import { DasApiAsset } from "@metaplex-foundation/digital-asset-standard-api";
import { Authority } from "program";

export interface ICreateForm {
  name: string;
  startDate: Date;
  vestingEndDate: Date;
  recipient: string;
  payoutInterval: number;
  selectedToken: DasApiAsset | null;
  amountToBeVested: string | number;
  cliffPaymentAmount: string | number;
  cancelAuthority: Authority;
  changeRecipientAuthority: Authority;
}
