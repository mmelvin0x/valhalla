import * as Yup from "yup";

export const dashboardSearchValidationSchema = () =>
  Yup.object().shape({
    search: Yup.string().trim().required("Required"),
  });
