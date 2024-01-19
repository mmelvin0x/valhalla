import { Authority, VestingType } from "program";
import {
  DasApiAsset,
  DasApiAssetList,
} from "@metaplex-foundation/digital-asset-standard-api";
import { FormikHelpers, useFormik } from "formik";
import {
  oneTimePaymentValidationSchema,
  tokenLockValidationSchema,
  vestingScheduleValidationSchema,
} from "./validationSchemas";
import { useCallback, useEffect, useMemo, useState } from "react";

import CreateForm from "./CreateForm";
import Head from "next/head";
import { ICreateForm } from "utils/interfaces";
import ReviewLockCard from "components/create/ReviewLockCard";
import SelectTokenDialog from "components/ui/modals/SelectTokenDialog";
import SelectTypeTabs from "./SelectTypeTabs";
import VestmentChart from "components/create/VestmentChart";
import axios from "axios";
import { createOneTimePayment } from "./createOneTimePayment";
import { createTokenLock } from "./createTokenLock";
import { createVestingSchedule } from "./createVestingSchedule";
import { useDates } from "utils/useDates";
import useProgram from "program/useProgram";

export default function CreateFeature() {
  const { wallet, connection } = useProgram();
  const { today, oneDayInMilliseconds } = useDates();

  const [vestingType, setVestingType] = useState<VestingType>(
    VestingType.VestingSchedule,
  );
  const [assets, setAssets] = useState<DasApiAsset[]>([]);
  const [vestingDuration, setVestingDuration] = useState<number>(0);

  const initialValues: ICreateForm = useMemo(
    () => {
      switch (vestingType) {
        case VestingType.VestingSchedule:
          return {
            name: "",
            startDate: new Date(),
            vestingEndDate: new Date(),
            recipient: "",
            payoutInterval: oneDayInMilliseconds,
            selectedToken: assets[0],
            amountToBeVested: "",
            cliffPaymentAmount: "",
            cancelAuthority: Authority.Neither,
            changeRecipientAuthority: Authority.Neither,
          };
        case VestingType.TokenLock:
          return {
            name: "",
            vestingEndDate: new Date(),
            selectedToken: assets[0],
            amountToBeVested: "",
          };
        case VestingType.OneTimePayment:
          return {
            name: "",
            vestingEndDate: new Date(),
            recipient: "",
            selectedToken: assets[0],
            amountToBeVested: "",
            cancelAuthority: Authority.Neither,
            changeRecipientAuthority: Authority.Neither,
          };
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [vestingType],
  );

  const validationSchema = useMemo(() => {
    switch (vestingType) {
      case VestingType.VestingSchedule:
        return vestingScheduleValidationSchema();
      case VestingType.TokenLock:
        return tokenLockValidationSchema();
      case VestingType.OneTimePayment:
        return oneTimePaymentValidationSchema();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vestingType]);

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
      switch (vestingType) {
        case VestingType.VestingSchedule:
          await createVestingSchedule(
            values,
            helpers,
            wallet,
            connection,
            vestingDuration,
            balance,
            today.toDate(),
          );
          break;
        case VestingType.TokenLock:
          await createTokenLock(
            values,
            helpers,
            wallet,
            connection,
            vestingDuration,
            balance,
            today.toDate(),
          );
          break;
        case VestingType.OneTimePayment:
          await createOneTimePayment(
            values,
            helpers,
            wallet,
            connection,
            vestingDuration,
            balance,
            today.toDate(),
          );
          break;
      }
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
    switch (vestingType) {
      case VestingType.VestingSchedule:
        break;
      case VestingType.TokenLock:
        formik.setFieldValue("startDate", today.toDate());
        formik.setFieldValue("recipient", wallet.publicKey.toBase58());
        formik.setFieldValue("payoutInterval", vestingDuration);
        formik.setFieldValue("cancelAuthority", Authority.Neither);
        formik.setFieldValue("changeRecipientAuthority", Authority.Neither);
        break;
      case VestingType.OneTimePayment:
        formik.setFieldValue("startDate", today.toDate());
        formik.setFieldValue("payoutInterval", vestingDuration);
        break;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vestingType]);

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
    <>
      <Head>
        <title>Valhalla | Token Vesting Solutions</title>
        <meta
          name="description"
          content="Token Vesting and Locks on Solana. Lock your tokens until Valhalla."
        />
      </Head>

      <header className="flex flex-col gap-8 mb-12">
        <h1 className="text-3xl font-bold">Configure a vesting account</h1>
        <p className="prose">
          Vesting Schedules, Token Locks, and One-Time Payments each offer
          distinct ways to manage token distribution.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 lg:gap-8">
        <div className="card">
          <div className="card-body">
            <SelectTypeTabs
              formik={formik}
              vestingType={vestingType}
              setVestingType={setVestingType}
            />

            <CreateForm formik={formik} vestingType={vestingType} />
          </div>
        </div>

        <div className="flex flex-col gap-2 lg:gap-8">
          {vestingType === VestingType.VestingSchedule && (
            <VestmentChart
              vestingEndDate={new Date(formik.values.vestingEndDate)}
              startDate={new Date(formik.values.startDate)}
              vestingDuration={vestingDuration}
              amountToBeVested={Number(formik.values.amountToBeVested)}
              payoutInterval={Number(formik.values.payoutInterval)}
              cliffPaymentAmount={Number(formik.values.cliffPaymentAmount)}
            />
          )}

          <ReviewLockCard
            funder={wallet.publicKey}
            recipient={formik.values.recipient}
            selectedToken={formik.values.selectedToken}
            startDate={new Date(formik.values.startDate)}
            vestingEndDate={new Date(formik.values.vestingEndDate)}
            vestingDuration={vestingDuration}
            amountToBeVested={Number(formik.values.amountToBeVested)}
            payoutInterval={Number(formik.values.payoutInterval)}
            cliffPaymentAmount={Number(formik.values.cliffPaymentAmount)}
            cancelAuthority={formik.values.cancelAuthority}
            changeRecipientAuthority={formik.values.changeRecipientAuthority}
            vestingType={vestingType}
          />
        </div>
      </div>

      <SelectTokenDialog assets={assets} formik={formik} />
    </>
  );
}
