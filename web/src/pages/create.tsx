import {
  DasApiAsset,
  DasApiAssetList,
} from "@metaplex-foundation/digital-asset-standard-api";
import { FormikHelpers, useFormik } from "formik";
import { useCallback, useEffect, useMemo, useState } from "react";

import AuthoritiesInput from "../components/create/AuthoritiesInput";
import { Authority } from "@valhalla/lib";
import ConnectWalletToContinue from "../components/ConnectWalletToContinue";
import Head from "next/head";
import { ICreateForm } from "../utils/interfaces";
import PayoutIntervalInput from "../components/create/PayoutIntervalInput";
import { PublicKey } from "@solana/web3.js";
import RecipientInput from "../components/create/RecipientInput";
import ReviewLockCard from "../components/create/ReviewLockCard";
import SelectTokenDialog from "../components/modals/SelectTokenDialog";
import SelectTokenInput from "../components/create/SelectTokenInput";
import StartDateInput from "../components/create/StartDateInput";
import VestingEndDateInput from "../components/create/VestingEndDateInput";
import VestmentChart from "../components/VestmentChart";
import axios from "axios";
import { createVault } from "../instructions/create";
import { toast } from "react-toastify";
import { useDates } from "../hooks/useDates";
import useProgram from "../hooks/useProgram";
import { useRouter } from "next/router";

export default function CreateFeature() {
  const router = useRouter();
  const { wallet, connection } = useProgram();
  const { today, tomorrow, oneDayInMilliseconds } = useDates();
  const [step, setStep] = useState<number>(0);

  const [vaultsToCreate, setVaultsToCreate] = useState<ICreateForm[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [assets, setAssets] = useState<(DasApiAsset & { token_info: any })[]>(
    []
  );
  const [totalVestingDuration, setVestingDuration] = useState<number>(0);

  const initialValues: ICreateForm = useMemo(
    () => ({
      name: "",
      startDate: today.toDate(),
      vestingEndDate: tomorrow.toDate(),
      recipient: "",
      payoutInterval: oneDayInMilliseconds,
      selectedToken: assets[0],
      amountToBeVested: "",
      cancelAuthority: Authority.Neither,
      autopay: true,
      startImmediately: true,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const formik = useFormik({
    initialValues,
    validateOnBlur: false,
    validateOnChange: false,
    validateOnMount: false,
    onSubmit: async (
      values: ICreateForm,
      helpers: FormikHelpers<ICreateForm>
    ) => {
      try {
        const txIds = await createVault(
          connection,
          wallet,
          vaultsToCreate.length ? vaultsToCreate : [values],
          totalVestingDuration
        );

        console.log(txIds);
        router.push("/dashboard");
      } catch (e) {
        console.error(e);
        toast.update("create", {
          type: "error",
          render: `Transaction failed: ${(e as Error).message}`,
        });
      } finally {
        helpers.setSubmitting(false);
      }
    },
  });

  const onNext = () => {
    switch (step) {
      case 0:
        if (!formik.values.name) {
          formik.setFieldError("name", "Required");
          return;
        }

        if (!formik.values.selectedToken) {
          formik.setFieldError("selectedToken", "Required");
          return;
        }

        setStep(step + 1);

        break;

      case 1:
        if (!formik.values.startDate) {
          formik.setFieldError("startDate", "Required");
          return;
        }

        if (!formik.values.vestingEndDate) {
          formik.setFieldError("vestingEndDate", "Required");
          return;
        }

        setStep(step + 1);

        break;

      case 2:
        if (
          !vaultsToCreate.length &&
          (!formik.values.recipient || !formik.values.amountToBeVested)
        ) {
          formik.setFieldError("recipient", "Required");
          formik.setFieldError("amountToBeVested", "Required");
          return;
        }

        if (vaultsToCreate.length && formik.values.recipient) {
          setVaultsToCreate([...vaultsToCreate, formik.values]);
        }

        setStep(step + 1);

        break;

      case 3:
        formik.handleSubmit();

        break;
    }
  };

  const onPageLoad = useCallback(async () => {
    if (!formik.values.selectedToken && wallet?.publicKey) {
      const { data } = await axios.get<DasApiAssetList>(
        `/api/getTokensByOwner/?owner=${wallet.publicKey.toString()}`
      );

      if (data.error) {
        toast.error(data.error as string);
        return;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setAssets(data.items as (DasApiAsset & { token_info: any })[]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallet.publicKey]);

  useEffect(() => {
    setVestingDuration(
      new Date(formik.values.vestingEndDate).getTime() -
        new Date(formik.values.startDate).getTime()
    );
  }, [formik.values.startDate, formik.values.vestingEndDate]);

  useEffect(() => {
    // Get all of the owners SPL Tokens and put them in a select/dropdown
    if (wallet?.publicKey && wallet?.signTransaction) {
      onPageLoad();
    }
  }, [onPageLoad, wallet?.publicKey, wallet?.signTransaction]);

  if (!wallet?.publicKey) {
    return <ConnectWalletToContinue />;
  }

  return (
    <div className="m-8">
      <Head>
        <title>Valhalla | Token Vesting Solutions</title>
        <meta
          name="description"
          content="Token Vesting and Locks on Solana. Lock your tokens until Valhalla."
        />
      </Head>

      <main
        className={
          step === 3
            ? "max-w-max mx-auto"
            : "grid grid-cols-1 lg:grid-cols-2 gap-8"
        }
      >
        <section className={`card`}>
          <div className="card-body flex flex-col justify-between gap-8">
            <form className="">
              {step === 0 && (
                <>
                  <h5>Vault Details</h5>
                  <p className="prose">
                    To start creating your vesting account, enter a memorable
                    name, select a token, and choose the total amount of tokens
                    to be deposited.
                  </p>

                  <div className="form-control my-4">
                    <label htmlFor="" className="label">
                      <span className="label-text font-bold">Name</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      className={`input input-bordered  ${
                        formik.errors.name ? "input-error" : ""
                      }`}
                      placeholder="You can search by this name later"
                      maxLength={32}
                      value={formik.values.name}
                      onChange={formik.handleChange}
                      disabled={formik.isSubmitting}
                    />
                    {formik.errors.name && (
                      <label htmlFor="" className="label">
                        <span className="label-text-alt text-error">
                          {formik.errors.name}
                        </span>
                      </label>
                    )}
                  </div>

                  <SelectTokenInput
                    values={formik.values}
                    errors={formik.errors}
                  />

                  <div className="flex items-center gap-4">
                    <label className="label cursor-pointer">
                      <span className="label-text font-bold">Autopay?</span>
                    </label>
                    <input
                      type="checkbox"
                      className="toggle"
                      name="autopay"
                      checked={formik.values.autopay}
                      onChange={formik.handleChange}
                      disabled={formik.isSubmitting}
                    />
                  </div>
                </>
              )}

              {step === 1 && (
                <>
                  <h5>Schedule Details</h5>
                  <p className="prose">
                    Now decide the length and payout interval of the account. If
                    you want the account to be cancellable, be sure to choose a
                    Cancel Authority. This is not irreversible.
                  </p>

                  <div className="flex items-center gap-2 mt-4">
                    <label htmlFor="" className="label">
                      <span className="label-text font-bold">
                        Start Immediately?
                      </span>
                    </label>

                    <input
                      type="checkbox"
                      className="toggle"
                      name="startImmediately"
                      checked={formik.values.startImmediately}
                      onChange={formik.handleChange}
                      disabled={formik.isSubmitting}
                    />
                  </div>

                  {!formik.values.startImmediately && (
                    <StartDateInput
                      disabled={formik.isSubmitting}
                      values={formik.values}
                      handler={formik.handleChange}
                      errors={formik.errors}
                    />
                  )}

                  <VestingEndDateInput
                    disabled={formik.isSubmitting}
                    values={formik.values}
                    handler={formik.handleChange}
                    errors={formik.errors}
                  />

                  <PayoutIntervalInput
                    disabled={formik.isSubmitting}
                    values={formik.values}
                    handler={formik.handleChange}
                    errors={formik.errors}
                  />

                  <AuthoritiesInput
                    disabled={formik.isSubmitting}
                    values={formik.values}
                    handler={formik.handleChange}
                    errors={formik.errors}
                  />
                </>
              )}

              {step === 2 && (
                <>
                  <p className="prose">
                    You can add multiple recipients. If you choose to do so, you
                    will need to select the amount of tokens for each one. If
                    you add many recipients, you will have to sign multiple
                    transactions.
                  </p>
                  {/* TODO-CHECK: resolve .sol addresses and add validations */}
                  <RecipientInput
                    formik={formik}
                    vaultsToCreate={vaultsToCreate}
                    setVaultsToCreate={setVaultsToCreate}
                    disabled={formik.isSubmitting}
                    values={formik.values}
                    handler={formik.handleChange}
                    errors={formik.errors}
                  />
                </>
              )}

              {step === 3 && (
                <ReviewLockCard
                  isReview={true}
                  vaultsToCreate={vaultsToCreate}
                  isSubmitting={formik.isSubmitting}
                  creator={wallet.publicKey}
                  recipient={
                    formik.values.recipient
                      ? new PublicKey(formik.values.recipient)
                      : null
                  }
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
                  autopay={formik.values.autopay}
                />
              )}
            </form>

            <div className="flex flex-col justify-between gap-8">
              <div className="flex gap-4 my-4">
                <button
                  className="btn btn-error"
                  type="button"
                  onClick={(e) => {
                    setStep(0);
                    setVaultsToCreate([]);
                    formik.handleReset(e);
                  }}
                  disabled={formik.isSubmitting}
                >
                  Reset
                </button>

                <button
                  className="btn btn-secondary"
                  type="button"
                  onClick={() => setStep(step - 1)}
                  disabled={step === 0 || formik.isSubmitting}
                >
                  Back
                </button>

                <button
                  className={"btn flex-1 btn-accent"}
                  type="button"
                  onClick={onNext}
                  disabled={formik.isSubmitting}
                >
                  {step === 3 ? "Create Vesting Account" : "Next"}
                </button>
              </div>

              <ul className="steps">
                <li className={step >= 0 ? "step step-accent" : "step"}>
                  Vault
                </li>
                <li className={step >= 1 ? "step step-accent" : "step"}>
                  Schedule
                </li>
                <li className={step >= 2 ? "step step-accent" : "step"}>
                  Recipients
                </li>
                <li className={step >= 3 ? "step step-accent" : "step"}>
                  Review
                </li>
              </ul>
            </div>
          </div>
        </section>

        {step !== 3 && (
          <div className="flex flex-col gap-8">
            <section className="card">
              <div className="card-body">
                <VestmentChart
                  formik={formik}
                  vestingEndDate={formik.values.vestingEndDate}
                  startDate={formik.values.startDate}
                  totalVestingDuration={totalVestingDuration}
                  amountToBeVested={Number(formik.values.amountToBeVested)}
                  payoutInterval={Number(formik.values.payoutInterval)}
                />
              </div>
            </section>

            <section className="card">
              <div className="card-body">
                <ReviewLockCard
                  isReview={false}
                  vaultsToCreate={vaultsToCreate}
                  isSubmitting={formik.isSubmitting}
                  creator={wallet.publicKey}
                  recipient={
                    formik.values.recipient
                      ? new PublicKey(formik.values.recipient)
                      : null
                  }
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
                  autopay={formik.values.autopay}
                />
              </div>
            </section>
          </div>
        )}
      </main>

      <SelectTokenDialog assets={assets} formik={formik} />
    </div>
  );
}
