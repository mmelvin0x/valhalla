import { ChangeEvent, FC, useEffect, useMemo, useState } from "react";
import useProgram from "hooks/useProgram";
import axios from "axios";
import {
  DasApiAsset,
  DasApiAssetList,
} from "@metaplex-foundation/digital-asset-standard-api";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import SelectTokenInput from "components/create/SelectTokenInput";
import ReviewLockCard from "components/ReviewLockCard";
import { Authority } from "models/types";
import Head from "next/head";
import StartDateInput from "components/create/StartDateInput";
import { useDates } from "hooks/useDates";
import VestingEndDateInput from "components/create/VestingEndDateInput";
import BeneficiaryInput from "components/create/BeneficiaryInput";
import PayoutIntervalInput from "components/create/PayoutIntervalInput";
import CliffPaymentAmountInput from "components/create/CliffPaymentAmountInput";
import AuthoritiesInput from "components/create/AuthoritiesInput";

const Create: FC = () => {
  const walletModel = useWalletModal();
  const { wallet } = useProgram();
  const { today, thirtyDays, ninetyDaysFromNow } = useDates();

  const [assets, setAssets] = useState<DasApiAsset[]>([]);

  // Lock State
  const [startDate, setStartDate] = useState<Date>(today);

  const [vestingDuration, setVestingDuration] = useState<number>(0);
  const [vestingEndDate, setVestingEndDate] = useState<Date>(
    new Date(ninetyDaysFromNow)
  );

  const [beneficiary, setBeneficiary] = useState<string>("");

  const [payoutInterval, setPayoutInterval] = useState<number>(thirtyDays);

  const [selectedToken, setSelectedToken] = useState<DasApiAsset | null>(null);
  const [amountToBeVested, setAmountToBeVested] = useState<number>(0);

  const [cliffPaymentAmount, setCliffPaymentAmount] = useState<number>(0);

  const [cancelAuthority, setCancelAuthority] = useState<Authority>(
    Authority.Neither
  );
  const [changeBeneficiaryAuthority, setChangeBeneficiaryAuthority] =
    useState<Authority>(Authority.Neither);

  // Methods
  const onReset = () => {};

  const onPageLoad = async () => {
    const {
      data: { cursor, items, limit, total },
    } = await axios.get<DasApiAssetList>(
      `/api/getTokensByOwner/?owner=${wallet.publicKey.toBase58()}`
    );

    setAssets(items);
    setSelectedToken(items[0]);
  };

  useEffect(() => {
    setVestingDuration(vestingEndDate.getTime() - startDate.getTime());
  }, [vestingEndDate]);

  useEffect(() => {
    // Get all of the owners SPL Tokens and put them in a select/dropdown
    if (wallet?.publicKey && wallet?.signTransaction) {
      onPageLoad();
    } else {
      walletModel.setVisible(true);
    }
  }, [wallet?.publicKey]);

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
        <div className="card">
          <div className="card-body">
            <div className="card-title">Configure the vesting account</div>

            <StartDateInput startDate={startDate} setStartDate={setStartDate} />

            <VestingEndDateInput
              vestingEndDate={vestingEndDate}
              setVestingEndDate={setVestingEndDate}
            />

            <BeneficiaryInput
              beneficiary={beneficiary}
              setBeneficiary={setBeneficiary}
            />

            <PayoutIntervalInput
              payoutInterval={payoutInterval}
              setPayoutInterval={setPayoutInterval}
            />

            <SelectTokenInput
              assets={assets}
              amountToBeVested={amountToBeVested}
              setAmountToBeVested={setAmountToBeVested}
              selectedToken={selectedToken}
              setSelectedToken={setSelectedToken}
            />

            <CliffPaymentAmountInput
              selectedToken={selectedToken}
              amountToBeVested={amountToBeVested}
              cliffPaymentAmount={cliffPaymentAmount}
              setCliffPaymentAmount={setCliffPaymentAmount}
            />

            <AuthoritiesInput
              cancelAuthority={cancelAuthority}
              setCancelAuthority={setCancelAuthority}
              changeBeneficiaryAuthority={changeBeneficiaryAuthority}
              setChangeBeneficiaryAuthority={setChangeBeneficiaryAuthority}
            />

            <div className="card-actions mt-2">
              <button className="btn btn-secondary" onClick={onReset}>
                Reset
              </button>
              <button className="btn btn-accent">Submit</button>
            </div>
          </div>
        </div>

        <ReviewLockCard
          funder={wallet.publicKey}
          beneficiary={beneficiary}
          selectedToken={selectedToken}
          startDate={startDate}
          vestingDuration={vestingDuration}
          amountToBeVested={amountToBeVested}
          payoutInterval={payoutInterval}
          cliffPaymentAmount={cliffPaymentAmount}
          cancelAuthority={cancelAuthority}
          changeBeneficiaryAuthority={changeBeneficiaryAuthority}
        />
      </div>
    </>
  );
};

export default Create;
