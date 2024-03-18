import * as Yup from "yup";

import { isPublicKey } from "@metaplex-foundation/umi";

export const vaultValidationSchema = () =>
  Yup.object().shape({
    name: Yup.string()
      .trim()
      .min(2, "Must be at least 2 characters")
      .max(32, "Must be less than or equal to 32 characters")
      .required("Required"),
    startDate: Yup.date().min(new Date()).required("Required"),
    vestingEndDate: Yup.date().min(new Date()).required("Required"),
    recipient: Yup.string()
      .trim()
      .test("isPublicKey", "Invalid address", (value) => isPublicKey(value))
      .required("Required"),
    payoutInterval: Yup.number().required("Required"),
    selectedToken: Yup.object().required("Required"),
    amountToBeVested: Yup.number()
      .min(1, "Must be at least 1")
      .required("Required"),
    cancelAuthority: Yup.number().required("Required"),
  });
