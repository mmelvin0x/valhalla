import {
  DasApiAsset,
  DasApiAssetList,
} from "@metaplex-foundation/digital-asset-standard-api";
import { FormikHelpers, useFormik } from "formik";
import {
  oneTimePaymentValidationSchema,
  tokenLockValidationSchema,
  vestingScheduleValidationSchema,
} from "./utils/validationSchemas";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Authority } from "program";
import CreateForm from "./ui/CreateForm";
import Head from "next/head";
import { ICreateForm } from "utils/interfaces";
import ReviewLockCard from "components/create/ui/ReviewLockCard";
import SelectTokenDialog from "components/ui/modals/SelectTokenDialog";
import SelectTypeTabs from "./ui/SelectTypeTabs";
import { VestingType } from "program";
import VestmentChart from "components/create/ui/VestmentChart";
import axios from "axios";
import { createScheduledPayment } from "./instructions/createScheduledPayment";
import { createTokenLock } from "./instructions/createTokenLock";
import { createVestingSchedule } from "./instructions/createVestingSchedule";
import { useDates } from "utils/useDates";
import useProgram from "program/useProgram";
import { useRouter } from "next/router";

export default function CreateFeature() {
  const router = useRouter();
  useEffect(() => {
    switch (router.query.vestingType) {
      case VestingType.VestingSchedule.toString():
        setVestingType(VestingType.VestingSchedule);
        break;
      case VestingType.TokenLock.toString():
        setVestingType(VestingType.TokenLock);
        break;
      case VestingType.ScheduledPayment.toString():
        setVestingType(VestingType.ScheduledPayment);
        break;
    }
  }, [router.query]);

  const { wallet, connection } = useProgram();
  const { today, oneDayInMilliseconds } = useDates();

  const [vestingType, setVestingType] = useState<VestingType>(
    VestingType.VestingSchedule,
  );
  const [assets, setAssets] = useState<DasApiAsset[]>([]);
  const [totalVestingDuration, setVestingDuration] = useState<number>(0);

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
        case VestingType.ScheduledPayment:
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
      case VestingType.ScheduledPayment:
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
            totalVestingDuration,
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
            totalVestingDuration,
            balance,
            today.toDate(),
          );
          break;
        case VestingType.ScheduledPayment:
          await createScheduledPayment(
            values,
            helpers,
            wallet,
            connection,
            totalVestingDuration,
            balance,
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
        formik.setFieldValue("payoutInterval", totalVestingDuration);
        formik.setFieldValue("cancelAuthority", Authority.Neither);
        formik.setFieldValue("changeRecipientAuthority", Authority.Neither);
        break;
      case VestingType.ScheduledPayment:
        formik.setFieldValue("startDate", today.toDate());
        formik.setFieldValue("payoutInterval", totalVestingDuration);
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="card">
          <div className="card-body">
            <div className="card-title">Configure an account</div>
            <SelectTypeTabs
              formik={formik}
              vestingType={vestingType}
              setVestingType={setVestingType}
            />

            <CreateForm formik={formik} vestingType={vestingType} />
          </div>
        </div>

        <div className="flex flex-col gap-8">
          {vestingType === VestingType.VestingSchedule && (
            <VestmentChart
              formik={formik}
              vestingEndDate={formik.values.vestingEndDate}
              startDate={formik.values.startDate}
              totalVestingDuration={totalVestingDuration}
              amountToBeVested={Number(formik.values.amountToBeVested)}
              payoutInterval={Number(formik.values.payoutInterval)}
              cliffPaymentAmount={Number(formik.values.cliffPaymentAmount)}
            />
          )}

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
