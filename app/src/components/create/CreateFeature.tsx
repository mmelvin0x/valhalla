import {
  DasApiAsset,
  DasApiAssetList,
} from "@metaplex-foundation/digital-asset-standard-api";
import { FormikHelpers, useFormik } from "formik";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Authority } from "program";
import CreateForm from "./ui/CreateForm";
import Head from "next/head";
import { ICreateForm } from "utils/interfaces";
import ReviewLockCard from "components/create/ui/ReviewLockCard";
import SelectTokenDialog from "components/ui/modals/SelectTokenDialog";
import VestmentChart from "components/create/ui/VestmentChart";
import axios from "axios";
import { createVault } from "./instructions/create";
import { useDates } from "utils/useDates";
import useProgram from "program/useProgram";
import { vaultValidationSchema } from "./utils/validationSchemas";

export default function CreateFeature() {
  const { wallet, connection, program } = useProgram();
  const { today, oneDayInMilliseconds } = useDates();

  const [assets, setAssets] = useState<DasApiAsset[]>([]);
  const [totalVestingDuration, setVestingDuration] = useState<number>(0);

  const initialValues: ICreateForm = useMemo(
    () => ({
      name: "",
      startDate: new Date(),
      vestingEndDate: new Date(),
      recipient: "",
      payoutInterval: oneDayInMilliseconds,
      selectedToken: assets[0],
      amountToBeVested: "",
      cancelAuthority: Authority.Neither,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const validationSchema = useMemo(() => vaultValidationSchema(), []);

  const formik = useFormik({
    initialValues,
    validationSchema,
    validateOnBlur: false,
    validateOnChange: false,
    validateOnMount: false,
    onSubmit: async (
      values: ICreateForm,
      helpers: FormikHelpers<ICreateForm>,
    ) => {
      await createVault(
        values,
        helpers,
        wallet,
        connection,
        program,
        totalVestingDuration,
        balance,
        today.toDate(),
      );
    },
  });

  const balance = useMemo(
    () =>
      // @ts-ignore
      formik.values.selectedToken?.token_info.balance
        ? // @ts-ignore
          formik.values.selectedToken?.token_info.balance /
          // @ts-ignore
          10 ** formik.values.selectedToken?.token_info.decimals
        : 0,
    [formik.values.selectedToken],
  );

  const onPageLoad = useCallback(async () => {
    const {
      data: { items },
    } = await axios.get<DasApiAssetList>(
      `/api/getTokensByOwner/?owner=${wallet.publicKey.toString()}`,
    );

    setAssets(items);
    formik.setFieldValue("selectedToken", items[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallet.publicKey]);

  useEffect(() => {
    setVestingDuration(
      new Date(formik.values.vestingEndDate).getTime() -
        new Date(formik.values.startDate).getTime(),
    );
  }, [formik.values.startDate, formik.values.vestingEndDate]);

  useEffect(() => {
    // Get all of the owners SPL Tokens and put them in a select/dropdown
    if (wallet?.publicKey && wallet?.signTransaction) {
      onPageLoad();
    }
  }, [onPageLoad, wallet?.publicKey, wallet?.signTransaction]);

  return (
    <div className="m-8">
      <Head>
        <title>Valhalla | Token Vesting Solutions</title>
        <meta
          name="description"
          content="Token Vesting and Locks on Solana. Lock your tokens until Valhalla."
        />
      </Head>

      <main className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section className="card">
          <div className="card-body">
            <div className="card-title">Configure an account</div>
            <CreateForm formik={formik} />
          </div>
        </section>

        <section className="flex flex-col gap-8">
          <VestmentChart
            formik={formik}
            vestingEndDate={formik.values.vestingEndDate}
            startDate={formik.values.startDate}
            totalVestingDuration={totalVestingDuration}
            amountToBeVested={Number(formik.values.amountToBeVested)}
            payoutInterval={Number(formik.values.payoutInterval)}
          />

          <ReviewLockCard
            creator={wallet.publicKey}
            recipient={formik.values.recipient}
            selectedToken={formik.values.selectedToken}
            startDate={formik.values.startDate}
            vestingEndDate={formik.values.vestingEndDate}
            totalVestingDuration={
              new Date(formik.values.vestingEndDate).getTime() -
              new Date(formik.values.startDate).getTime()
            }
            amountToBeVested={Number(formik.values.amountToBeVested)}
            payoutInterval={Number(formik.values.payoutInterval)}
            cancelAuthority={formik.values.cancelAuthority}
          />
        </section>
      </main>

      <SelectTokenDialog assets={assets} formik={formik} />
    </div>
  );
}
