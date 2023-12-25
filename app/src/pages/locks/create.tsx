import { FC, FormEvent, useEffect, useState } from "react";
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
import { BN } from "bn.js";
import { notify } from "utils/notifications";
import {
  PublicKey,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import {
  LOCKER_KEY,
  TREASURY_KEY,
  getLockKey,
  getLockTokenAccountKey,
  getUserTokenAccountKey,
} from "utils/accounts";
import { useConnection } from "@solana/wallet-adapter-react";

const Locks: FC = () => {
  const today = new Date();
  const thirtyDays = new Date().setDate(today.getDate() + 30);
  const sixtyDays = new Date().setDate(today.getDate() + 60);
  const ninetyDays = new Date().setDate(today.getDate() + 90);
  const oneThousandYears = new Date().setFullYear(today.getFullYear() + 1000);

  const walletModel = useWalletModal();
  const { connection } = useConnection();
  const { wallet, program } = useProgram();
  const [step, setStep] = useState<number>(0);
  const [paginationCursor, setPaginationCursor] = useState<string | null>(null);
  const [assets, setAssets] = useState<DasApiAsset[]>([]);
  const [paginationLimit, setPaginationLimit] = useState<number>(1000);
  const [paginationTotal, setPaginationTotal] = useState<number>(0);
  const [selectedToken, setSelectedToken] = useState<DasApiAsset | null>(null);
  const [depositAmount, setDepositAmount] = useState<number>(0);
  const [unlockDate, setUnlockDate] = useState<number>(thirtyDays);

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
    }

    if (!depositAmount) {
      notify({
        message: "Please enter an amount",
        type: "error",
      });
    }

    if (!unlockDate) {
      notify({
        message: "Please select an unlock date",
        type: "error",
      });
    }

    console.log({
      user: wallet.publicKey.toBase58(),
      treasury: TREASURY_KEY.toBase58(),
      locker: LOCKER_KEY.toBase58(),
      lock: getLockKey(
        LOCKER_KEY,
        wallet.publicKey,
        new PublicKey(selectedToken.id)
      ).toBase58(),
      lockTokenAccount: getLockTokenAccountKey(
        getLockKey(
          LOCKER_KEY,
          wallet.publicKey,
          new PublicKey(selectedToken.id)
        ),
        wallet.publicKey,
        new PublicKey(selectedToken.id)
      ).toBase58(),
      userTokenAccount: await getUserTokenAccountKey(
        new PublicKey(selectedToken.id),
        wallet.publicKey
      ).toBase58(),
      mint: new PublicKey(selectedToken.id).toBase58(),
    });

    try {
      // Create the lock
      const createLockIx = await program.methods
        .createLock(
          new BN(Math.floor(unlockDate / 1000)),
          new BN(depositAmount)
        )
        .accounts({
          user: wallet.publicKey,
          treasury: TREASURY_KEY,
          locker: LOCKER_KEY,
          lock: getLockKey(
            LOCKER_KEY,
            wallet.publicKey,
            new PublicKey(selectedToken.id)
          ),
          lockTokenAccount: getLockTokenAccountKey(
            getLockKey(
              LOCKER_KEY,
              wallet.publicKey,
              new PublicKey(selectedToken.id)
            ),
            wallet.publicKey,
            new PublicKey(selectedToken.id)
          ),
          userTokenAccount: await getUserTokenAccountKey(
            new PublicKey(selectedToken.id),
            wallet.publicKey
          ),
          mint: new PublicKey(selectedToken.id),
        })
        .instruction();

      const latestBlockHash = await connection.getLatestBlockhash();
      const messageV0 = new TransactionMessage({
        payerKey: wallet.publicKey,
        recentBlockhash: latestBlockHash.blockhash,
        instructions: [createLockIx],
      }).compileToV0Message();
      const createLockTx = new VersionedTransaction(messageV0);
      const createLockTxSig = await wallet.sendTransaction(
        createLockTx,
        connection
      );
      console.log("-> ~ onSubmit ~ createLockTxSig:", createLockTxSig);
    } catch (e) {}
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
    if (wallet.publicKey && wallet.connected && wallet.signMessage) {
      onPageLoad();
    } else {
      walletModel.setVisible(true);
    }
  }, [wallet.connected]);

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
          dates={{ thirtyDays, sixtyDays, ninetyDays, oneThousandYears }}
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
