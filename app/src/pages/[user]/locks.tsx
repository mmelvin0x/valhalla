import { FC, useEffect, useState } from "react";
import useProgram from "hooks/useProgram";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import LoadingSpinner from "components/LoadingSpinner";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { LockAccount, getLocksByUser } from "program/accounts";
import LockListCard from "components/LockListCard";
import { notify } from "utils/notifications";
import { TransactionSignature } from "@solana/web3.js";
import Link from "next/link";
import { getExplorerUrl } from "utils/explorer";
import { shortenSignature } from "utils/formatters";
import DepositToLockDialog from "components/modals/DepositToLockDialog";
import { depositToLock, extendLock } from "program/instructions";
import { BN } from "bn.js";
import SelectDateCard from "components/create-lock/SelectDateCard";
import ExtendLockDialog from "components/modals/ExtendLockDialog";

const UserLocks: FC = () => {
  const today = new Date();
  const thirtyDays = new Date().setDate(today.getDate() + 30);
  const sixtyDays = new Date().setDate(today.getDate() + 60);
  const ninetyDays = new Date().setDate(today.getDate() + 90);
  const oneThousandYears = new Date().setFullYear(today.getFullYear() + 1000);

  const { connection } = useConnection();
  const { connected } = useWallet();
  const { wallet, program } = useProgram();

  const [locks, setLocks] = useState<LockAccount[]>([]);
  const [selectedLock, setSelectedLock] = useState<LockAccount | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [depositAmount, setDepositAmount] = useState<number>(0);
  const [unlockDate, setUnlockDate] = useState<number>(thirtyDays);

  const getLocks = async () => {
    setIsLoading(true);
    // TODO: User locks should be set on global state
    const theLocks = await getLocksByUser(
      connection,
      wallet.publicKey,
      program
    );
    console.log("-> ~ theLocks:", theLocks);
    setLocks(theLocks);
    setIsLoading(false);
  };

  useEffect(() => {
    if (program?.programId && wallet?.publicKey) {
      getLocks();
    }
  }, [connected]);

  const onDepositToLock = async (lock: LockAccount) => {
    if (!wallet?.publicKey) {
      return;
    }

    if (depositAmount <= 0) {
      notify({
        message: "Please enter an amount",
        type: "error",
      });

      return;
    }

    const balance =
      BigInt(lock.userTokenAccount.amount) / BigInt(10 ** lock.mint.decimals);
    if (depositAmount > Number(balance)) {
      notify({
        message: "You don't have enough tokens",
        type: "error",
      });

      return;
    }

    setIsLoading(true);
    let signature: TransactionSignature = "";
    try {
      const depositToLockTx = await depositToLock(
        wallet.publicKey,
        depositAmount,
        lock,
        program
      );

      signature = await wallet.sendTransaction(depositToLockTx, connection);
      await connection.confirmTransaction(signature, "confirmed");

      await getLocks();
      setDepositAmount(0);
      setIsLoading(false);

      notify({
        message: "Transaction sent",
        type: "success",
        description: `Transaction has been sent to the network. Check it at ${(
          <Link href={getExplorerUrl(selectedLock.endpoint, signature)}>
            {shortenSignature(signature)}
          </Link>
        )}`,
      });
    } catch (error) {
      console.error(error);
      setIsLoading(false);

      notify({
        message: "Transaction failed",
        type: "error",
        description: error.message,
      });
    }
  };

  const onExtendLock = async (lock: LockAccount) => {
    if (!wallet?.publicKey) {
      return;
    }

    if (unlockDate <= new BN(1000).mul(lock.unlockDate).toNumber()) {
      notify({
        message: "The unlock date must be greater than the current one",
        type: "error",
      });

      return;
    }

    setIsLoading(true);
    let signature: TransactionSignature = "";
    try {
      const extendLockTx = await extendLock(
        wallet.publicKey,
        unlockDate,
        lock,
        program
      );

      signature = await wallet.sendTransaction(extendLockTx, connection);
      await connection.confirmTransaction(signature, "confirmed");

      await getLocks();
      setUnlockDate(today.getTime());
      setIsLoading(false);

      notify({
        message: "Transaction sent",
        type: "success",
        // @ts-ignore
        description: (
          <Link
            className="link link-accent"
            href={getExplorerUrl(selectedLock.endpoint, signature)}
          >
            {shortenSignature(signature)}
          </Link>
        ),
      });
    } catch (error) {
      console.error(error);
      setIsLoading(false);

      notify({
        message: "Transaction failed",
        type: "error",
        description: error.message,
      });
    }
  };

  return (
    <div className="flex flex-col gap-8 items-center justify-center py-10">
      <h1 className="text-6xl font-bold">Your Locks</h1>

      {!wallet?.publicKey && (
        <div className="flex flex-col items-center gap-6">
          <p className="prose">Connect your wallet to get started</p>
          <WalletMultiButton />
        </div>
      )}

      {!isLoading && !locks.length && wallet?.publicKey && (
        <div className="flex flex-col items-center gap-4">
          <p className="prose">No locks created yet!</p>
          <Link href="/locks/create" className="btn btn-primary">
            Create a lock
          </Link>
        </div>
      )}

      {isLoading && <LoadingSpinner />}

      {!isLoading &&
        locks.map((lock) => (
          <div key={lock.publicKey.toBase58()}>
            <LockListCard lock={lock} setSelectedLock={setSelectedLock} />
            <DepositToLockDialog
              lock={lock}
              depositAmount={depositAmount}
              setDepositAmount={setDepositAmount}
              onSubmit={onDepositToLock}
            />
            <ExtendLockDialog
              lock={lock}
              unlockDate={unlockDate}
              setUnlockDate={setUnlockDate}
              onSubmit={onExtendLock}
              dates={{
                today: today.getTime(),
                thirtyDays,
                sixtyDays,
                ninetyDays,
                oneThousandYears,
              }}
            />
          </div>
        ))}
    </div>
  );
};

export default UserLocks;
