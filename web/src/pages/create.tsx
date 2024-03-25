import {
  DasApiAsset,
  DasApiAssetList,
} from "@metaplex-foundation/digital-asset-standard-api";
import { FormikHelpers, useFormik } from "formik";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Authority } from "@valhalla/lib";
import BN from "bn.js";
import ConnectWalletToContinue from "../components/ConnectWalletToContinue";
import CreateForm from "../components/create/CreateForm";
import Head from "next/head";
import { ICreateForm } from "../utils/interfaces";
import { IconUsersPlus } from "@tabler/icons-react";
import { PublicKey } from "@solana/web3.js";
import ReviewLockCard from "../components/create/ReviewLockCard";
import SelectTokenDialog from "../components/modals/SelectTokenDialog";
import VestmentChart from "../components/VestmentChart";
import axios from "axios";
import { createVault } from "../instructions/create";
import { schedule } from "../utils/schedule";
import { toast } from "react-toastify";
import { useDates } from "../utils/useDates";
import useProgram from "../utils/useProgram";
import { useRouter } from "next/router";
import { vaultValidationSchema } from "../utils/vaultValidationSchema";

export default function CreateFeature() {
  const router = useRouter();
  const { wallet, connection } = useProgram();
  const { today, tomorrow, oneDayInMilliseconds } = useDates();

  const [assets, setAssets] = useState<DasApiAsset[]>([]);
  const [totalVestingDuration, setVestingDuration] = useState<number>(0);
  const [vaultsToCreate, setVaultsToCreate] = useState<ICreateForm[]>([]);

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
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
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
      helpers: FormikHelpers<ICreateForm>
    ) => {
      try {
        setVaultsToCreate([
          ...vaultsToCreate,
          JSON.parse(JSON.stringify(values)),
        ]);

        const identifier = await createVault(
          connection,
          wallet,
          [...vaultsToCreate, values],
          helpers,
          totalVestingDuration,
          today.toDate()
        );

        if (values.autopay) {
          await schedule(identifier);
        }

        if (identifier.gt(new BN(0))) {
          router.push(`/vault/${identifier.toString()}`);
        }
      } catch (e) {
        console.error(e);
        toast.error("Failed to create the vesting account!");
      }
    },
  });

  const onAddRecipient = async () => {
    const errors = await formik.validateForm();

    if (!Object.keys(errors).length) {
      setVaultsToCreate([
        ...vaultsToCreate,
        JSON.parse(JSON.stringify(formik.values)) as ICreateForm,
      ]);

      formik.setFieldValue("name", "");
      formik.setFieldValue("recipient", "");
      formik.setFieldValue("amountToBeVested", "");
    }
  };

  const onPageLoad = useCallback(async () => {
    if (!formik.values.selectedToken && wallet?.publicKey) {
      const {
        data: { items },
      } = await axios.get<DasApiAssetList>(
        `/api/getTokensByOwner/?owner=${wallet.publicKey.toString()}`
      );

      setAssets(items);
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
    <div className="m-8 mt-0">
      <Head>
        <title>Valhalla | Token Vesting Solutions</title>
        <meta
          name="description"
          content="Token Vesting and Locks on Solana. Lock your tokens until Valhalla."
        />
      </Head>

      <main className="flex flex-wrap gap-8">
        <section className="card flex-1">
          <div className="card-body justify-between">
            <div className="card-title">Configure an account</div>
            <CreateForm formik={formik} />
          </div>
        </section>

        <section className="flex flex-col gap-8">
          <aside className="card">
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
          </aside>

          <aside className="card">
            <div className="card-body">
              <ReviewLockCard
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
          </aside>

          <aside className="card">
            <div className="card-body">
              <div className="flex justify-between mt-4">
                <div className="flex items-center gap-1">
                  <button
                    className="btn btn-circle btn-success"
                    type="button"
                    title="Add another recipient"
                    disabled={formik.isSubmitting}
                    onClick={onAddRecipient}
                  >
                    <IconUsersPlus />
                  </button>
                  Add a recipient?
                </div>

                <div className="flex gap-2">
                  <button
                    className="btn btn-error"
                    type="button"
                    onClick={formik.handleReset}
                    disabled={formik.isSubmitting}
                  >
                    Reset
                  </button>

                  <button
                    className="btn btn-accent"
                    type="button"
                    onClick={() => formik.handleSubmit()}
                    disabled={formik.isSubmitting}
                  >
                    Create
                  </button>
                </div>
              </div>
            </div>
          </aside>
        </section>
      </main>

      <SelectTokenDialog assets={assets} formik={formik} />
    </div>
  );
}
