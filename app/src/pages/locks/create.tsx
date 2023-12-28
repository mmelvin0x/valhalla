import { FC, useEffect, useState } from "react";
import useProgram from "hooks/useProgram";
import axios from "axios";
import {
  DasApiAsset,
  DasApiAssetList,
} from "@metaplex-foundation/digital-asset-standard-api";
import SelectTokenDialog from "components/modals/SelectTokenDialog";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import SelectTokenCard from "components/create-lock/SelectTokenCard";
import SelectDateCard from "components/create-lock/SelectDateCard";
import ReviewLockCard from "components/create-lock/ReviewLockCard";
import { notify } from "utils/notifications";
import { PublicKey, TransactionSignature } from "@solana/web3.js";
import { useConnection } from "@solana/wallet-adapter-react";
import { useRouter } from "next/router";
import { getExplorerUrl } from "utils/explorer";
import { createLock } from "program/instructions";
import Link from "next/link";
import { shortenSignature } from "utils/formatters";

const Locks: FC = () => {
  const today = new Date();
  const thirtyDays = new Date().setDate(today.getDate() + 30);
  const sixtyDays = new Date().setDate(today.getDate() + 60);
  const ninetyDays = new Date().setDate(today.getDate() + 90);
  const oneThousandYears = new Date().setFullYear(today.getFullYear() + 1000);

  const router = useRouter();
  const walletModel = useWalletModal();
  const { connection } = useConnection();
  const { program, wallet } = useProgram();

  const [assets, setAssets] = useState<DasApiAsset[]>([]);
  const [selectedToken, setSelectedToken] = useState<DasApiAsset | null>(null);

  const [step, setStep] = useState<number>(0);
  const [depositAmount, setDepositAmount] = useState<number>(0);
  const [unlockDate, setUnlockDate] = useState<number>(thirtyDays);

  const [paginationTotal, setPaginationTotal] = useState<number>(0);
  const [paginationLimit, setPaginationLimit] = useState<number>(1000);
  const [paginationCursor, setPaginationCursor] = useState<string | null>(null);

  const onReset = () => {
    setSelectedToken(null);
    setDepositAmount(0);
    setUnlockDate(thirtyDays);
    setStep(0);
  };

  const onSubmit = async () => {
    // Validate the form
    if (!selectedToken) {
      notify({
        message: "Please select a token",
        type: "error",
      });

      return;
    }

    if (!depositAmount) {
      notify({
        message: "Please enter an amount",
        type: "error",
      });

      return;
    }

    if (!unlockDate) {
      notify({
        message: "Please select an unlock date",
        type: "error",
      });

      return;
    }

    let signature: TransactionSignature = "";
    try {
      // Create the lock
      const createLockTx = await createLock(
        wallet.publicKey,
        unlockDate,
        depositAmount,
        new PublicKey(selectedToken.id),
        program
      );

      signature = await wallet.sendTransaction(createLockTx, connection);
      await connection.confirmTransaction(signature, "confirmed");

      notify({
        message: "Transaction sent",
        type: "success",
        // @ts-ignore
        description: (
          <Link
            className="link link-accent"
            href={getExplorerUrl(
              program.provider.connection.rpcEndpoint,
              signature
            )}
          >
            {shortenSignature(signature)}
          </Link>
        ),
      });

      router.push(`../${wallet.publicKey.toBase58()}/locks`);
    } catch (e) {
      console.error(e);
      notify({
        type: "error",
        message: "Transaction failed!",
        description: e?.message,
        txid: signature,
      });
    }
  };

  const onPageLoad = async () => {
    const {
      data: { cursor, items, limit, total },
    } = await axios.get<DasApiAssetList>(
      `/api/getTokensByOwner/?owner=${wallet.publicKey.toBase58()}`
    );

    setAssets(items);
    setPaginationLimit(limit);
    setPaginationTotal(total);
    setPaginationCursor(cursor as string);
  };

  useEffect(() => {
    // Get all of the owners SPL Tokens and put them in a select/dropdown
    if (wallet?.publicKey && wallet?.signTransaction) {
      onPageLoad();
    } else {
      walletModel.setVisible(true);
    }
  }, [wallet?.publicKey]);

  return (
    <div className="flex flex-col items-center gap-8 p-10 max-w-screen-md mx-auto">
      <h1 className="text-center degen-locker">Create a Lock</h1>

      <div className="flex flex-col items-center gap-6">
        <p className="prose text-center">
          Locking liquidity tokens in DeFi projects boosts trust and security,
          stabilizes prices by ensuring asset availability, and signals
          long-term commitment, fostering investor confidence and community
          involvement.
        </p>
      </div>

      {step === 0 && (
        <SelectTokenCard
          depositAmount={depositAmount}
          setDepositAmount={setDepositAmount}
          selectedToken={selectedToken}
          setSelectedToken={setSelectedToken}
        />
      )}

      {step === 1 && (
        <SelectDateCard
          unlockDate={unlockDate}
          setUnlockDate={setUnlockDate}
          dates={{
            today: today.getTime(),
            thirtyDays,
            sixtyDays,
            ninetyDays,
            oneThousandYears,
          }}
        />
      )}

      {step === 2 && (
        <ReviewLockCard
          selectedToken={selectedToken}
          unlockDate={unlockDate}
          depositAmount={depositAmount}
        />
      )}

      <ul className="steps steps-horizontal">
        <li className="step step-primary">Token</li>
        <li className={`step ${step >= 1 && "step-primary"}`}>Unlock Date</li>
        <li className={`step ${step >= 2 && "step-primary"}`}>Submit</li>
      </ul>

      <div className="grid grid-cols-2 gap-4">
        {step === 0 && (
          <button className="btn btn-warning btn-block" onClick={onReset}>
            Reset
          </button>
        )}

        {step > 0 && (
          <button
            className="btn btn-secondary btn-block"
            onClick={() => setStep(step - 1)}
          >
            Previous
          </button>
        )}

        <button
          className={`btn btn-block ${
            step >= 2 ? "btn-accent" : "btn-primary"
          }`}
          disabled={!selectedToken || !depositAmount}
          onClick={() => (step >= 2 ? onSubmit() : setStep(step + 1))}
        >
          {step >= 2 ? "Submit" : "Next"}
        </button>
      </div>

      <SelectTokenDialog assets={assets} onTokenSelect={setSelectedToken} />
    </div>
  );
};

export default Locks;
