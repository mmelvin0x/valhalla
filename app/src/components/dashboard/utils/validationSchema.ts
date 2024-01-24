import * as Yup from "yup";

import { isPublicKey } from "@metaplex-foundation/umi";

export const dashboardSearchValidationSchema = () =>
  Yup.object().shape({
    search: Yup.string()
      .trim()
      .required("Required")
      .test("isPublicKey", "Invalid address", (value) => isPublicKey(value)),
  });
