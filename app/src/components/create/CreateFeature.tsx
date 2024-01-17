import {
  DasApiAsset,
  DasApiAssetList,
} from "@metaplex-foundation/digital-asset-standard-api";
import { isPublicKey } from "@metaplex-foundation/umi";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import {
  PublicKey,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import axios from "axios";
import AuthoritiesInput from "components/create/AuthoritiesInput";
import CliffPaymentAmountInput from "components/create/CliffPaymentAmountInput";
import PayoutIntervalInput from "components/create/PayoutIntervalInput";
import RecipientInput from "components/create/RecipientInput";
import ReviewLockCard from "components/create/ReviewLockCard";
import SelectTokenInput from "components/create/SelectTokenInput";
import StartDateInput from "components/create/StartDateInput";
import VestingEndDateInput from "components/create/VestingEndDateInput";
import VestmentChart from "components/create/VestmentChart";
import Head from "next/head";
import { useRouter } from "next/router";
import {
  Authority,
  CreateLockInstructionAccounts,
  CreateLockInstructionArgs,
  createCreateLockInstruction,
} from "program";
import useProgram from "program/useProgram";
import { ChangeEvent, FC, useCallback, useEffect, useState } from "react";
import { TREASURY, getPDAs } from "utils/constants";
import { getNameArg, shortenSignature } from "utils/formatters";
import { notify } from "utils/notifications";
import { useDates } from "utils/useDates";
import { FormikHelpers, useFormik } from "formik";
import * as Yup from "yup";
import SelectTokenDialog from "components/ui/modals/SelectTokenDialog";
import { ICreateForm } from "utils/interfaces";

export default function CreateFeature() {
  const router = useRouter();
  const { wallet, connection } = useProgram();
  const {
    today,
    tomorrow,
    oneDayInMilliseconds,
    thirtyDays,
    ninetyDaysFromNow,
  } = useDates();

  const [assets, setAssets] = useState<DasApiAsset[]>([]);
  const [vestingDuration, setVestingDuration] = useState<number>(0);
  const [selectedToken, setSelectedToken] = useState<DasApiAsset | null>(null);

  const initialValues: ICreateForm = {
    name: "",
    startDate: new Date(),
    vestingEndDate: new Date(),
    recipient: "",
    payoutInterval: oneDayInMilliseconds,
    selectedToken: null,
    amountToBeVested: "",
    cliffPaymentAmount: "",
    cancelAuthority: Authority.Neither,
    changeRecipientAuthority: Authority.Neither,
  };
  const validationSchema = Yup.object().shape({
    name: Yup.string()
      .trim()
      .min(2, "Must be at least 2 characters")
      .max(32, "Must be less than 32 characters")
      .required("Required"),
    startDate: Yup.date().min(new Date(today)).required("Required"),
    vestingEndDate: Yup.date().min(new Date(tomorrow)).required("Required"),
    recipient: Yup.string().trim().required("Required"),
    payoutInterval: Yup.number().required("Required"),
    selectedToken: Yup.object().required("Required"),
    amountToBeVested: Yup.number().required("Required"),
    cliffPaymentAmount: Yup.number().required("Required"),
    cancelAuthority: Yup.number().required("Required"),
    changeRecipientAuthority: Yup.number().required("Required"),
  });

  const formik = useFormik({
    initialValues,
    validationSchema,
    onReset: (values: ICreateForm, helpers: FormikHelpers<ICreateForm>) => {
      helpers.resetForm();
    },
    onSubmit: async (
      values: ICreateForm,
      helpers: FormikHelpers<ICreateForm>,
    ) => {
      console.log("-> ~ onFormSubmit ~ helpers:", helpers);
      console.log("-> ~ onFormSubmit ~ values:", values);
      return;

      // validate balance
      // validate vesting duration
      // validate reicpient

      const createLockInstructionArgs: CreateLockInstructionArgs = {
        cancelAuthority: formik.values.cancelAuthority,
        changeRecipientAuthority: formik.values.changeRecipientAuthority,
        amountToBeVested: Number(formik.values.amountToBeVested),
        cliffPaymentAmount: Number(formik.values.cliffPaymentAmount),
        vestingDuration: Math.round(Number(vestingDuration / 1000)),
        payoutInterval: Math.round(formik.values.payoutInterval / 1000),
        startDate: Math.round(formik.values.startDate.getTime() / 1000),
        name: getNameArg(formik.values.name),
      };

      const mint = new PublicKey(selectedToken.id);
      const recipientKey = new PublicKey(formik.values.recipient);
      const [locker, lock, lockTokenAccount] = getPDAs(
        wallet.publicKey,
        recipientKey,
        mint,
      );
      const funderTokenAccount = getAssociatedTokenAddressSync(
        mint,
        new PublicKey(wallet.publicKey),
        false,
        TOKEN_2022_PROGRAM_ID,
      );
      const recipientTokenAccount = getAssociatedTokenAddressSync(
        mint,
        new PublicKey(formik.values.recipient),
        false,
        TOKEN_2022_PROGRAM_ID,
      );

      const createLockInstructionAccounts: CreateLockInstructionAccounts = {
        funder: wallet.publicKey,
        recipient: new PublicKey(formik.values.recipient),
        locker,
        treasury: TREASURY,
        lock,
        lockTokenAccount,
        funderTokenAccount,
        recipientTokenAccount,
        mint,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      };

      try {
        const createLockInstruction = createCreateLockInstruction(
          createLockInstructionAccounts,
          createLockInstructionArgs,
        );

        const latestBlockhash = await connection.getLatestBlockhash();
        const messageV0 = new TransactionMessage({
          payerKey: wallet.publicKey,
          recentBlockhash: latestBlockhash.blockhash,
          instructions: [createLockInstruction],
        }).compileToV0Message();

        const tx = new VersionedTransaction(messageV0);
        const txid = await wallet.sendTransaction(tx, connection);
        const confirmation = await connection.confirmTransaction({
          signature: txid,
          blockhash: latestBlockhash.blockhash,
          lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
        });

        if (confirmation.value.err) {
          notify({
            message: "Transaction Failed",
            description: `Transaction ${shortenSignature(txid)} failed (${
              confirmation.value.err
            })`,
            type: "error",
          });
        }

        notify({
          message: "Transaction sent",
          description: `Transaction ${shortenSignature(txid)} has been sent`,
          type: "success",
        });

        router.push("/dashboard");
      } catch (error) {
        console.log("-> ~ error", error);
        notify({
          message: "Transaction Failed",
          description: `${error}`,
          type: "error",
        });
      }
    },
  });

  const onPageLoad = useCallback(async () => {
    const {
      data: { items },
    } = await axios.get<DasApiAssetList>(
      `/api/getTokensByOwner/?owner=${wallet.publicKey.toString()}`,
    );

    setAssets(items);
    setSelectedToken(items[0]);
  }, [wallet.publicKey]);

  useEffect(() => {
    if (selectedToken) {
      formik.setFieldValue("selectedToken", selectedToken);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedToken]);

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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 lg:gap-8">
        <form
          className="card"
          onReset={formik.handleReset}
          onSubmit={formik.handleSubmit}
        >
          <div className="card-body">
            <div className="card-title">Configure the vesting account</div>
            <div className="form-control">
              <label htmlFor="" className="label">
                <span className="label-text font-bold">Name</span>
              </label>
              <input
                type="text"
                className="input input-bordered input-sm"
                placeholder="Name the lock"
                maxLength={32}
                value={formik.values.name}
                onChange={formik.handleChange}
              />
            </div>

            {/* TODO-CHECK: resolve .sol addresses and add validations */}
            <RecipientInput
              values={formik.values}
              handler={formik.handleChange}
              errors={formik.errors}
            />

            {/* TODO: replace default image with "UNK" */}
            <SelectTokenInput
              values={formik.values}
              handler={formik.handleChange}
              errors={formik.errors}
            />

            {/* TODO: Dates are wonky, we need to include times and consider timezones */}
            <StartDateInput
              values={formik.values}
              handler={formik.handleChange}
              errors={formik.errors}
            />

            {/* TODO: Dates are wonky, we need to include times and consider timezones */}
            <VestingEndDateInput
              values={formik.values}
              handler={formik.handleChange}
              errors={formik.errors}
            />

            <PayoutIntervalInput
              values={formik.values}
              handler={formik.handleChange}
              errors={formik.errors}
            />

            {/* TODO: Consider bringing back the switch for this */}
            <CliffPaymentAmountInput
              values={formik.values}
              handler={formik.handleChange}
              errors={formik.errors}
            />

            <AuthoritiesInput
              values={formik.values}
              handler={formik.handleChange}
              errors={formik.errors}
            />

            <div className="card-actions mt-2">
              <button className="btn btn-secondary" type="reset">
                Reset
              </button>
              <button className="btn btn-accent" type="submit">
                Submit
              </button>
            </div>
          </div>
        </form>

        <div className="flex flex-col gap-2 lg:gap-8">
          {/* TODO: I think the dates are still a little wonky here */}
          <VestmentChart
            vestingEndDate={new Date(formik.values.vestingEndDate)}
            startDate={new Date(formik.values.startDate)}
            vestingDuration={vestingDuration}
            amountToBeVested={Number(formik.values.amountToBeVested)}
            payoutInterval={Number(formik.values.payoutInterval)}
            cliffPaymentAmount={Number(formik.values.cliffPaymentAmount)}
          />

          <ReviewLockCard
            funder={wallet.publicKey}
            recipient={formik.values.recipient}
            selectedToken={formik.values.selectedToken}
            startDate={new Date(formik.values.startDate)}
            vestingDuration={vestingDuration}
            amountToBeVested={Number(formik.values.amountToBeVested)}
            payoutInterval={Number(formik.values.payoutInterval)}
            cliffPaymentAmount={Number(formik.values.cliffPaymentAmount)}
            cancelAuthority={formik.values.cancelAuthority}
            changeRecipientAuthority={formik.values.changeRecipientAuthority}
          />
        </div>
      </div>

      <SelectTokenDialog assets={assets} onTokenSelect={setSelectedToken} />
    </>
  );
}
