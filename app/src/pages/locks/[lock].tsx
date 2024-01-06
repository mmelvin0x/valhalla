import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { PublicKey, TransactionSignature } from "@solana/web3.js";
import BN from "bn.js";
import LoadingSpinner from "components/LoadingSpinner";
import Score from "components/Score";
import DepositToLockDialog from "components/modals/DepositToLockDialog";
import ExtendLockDialog from "components/modals/ExtendLockDialog";
import useProgram from "hooks/useProgram";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { LockAccount, getLockByPublicKey } from "program/accounts";
import { depositToLock, extendLock } from "program/instructions";
import { useEffect, useMemo, useState } from "react";
import { FaPlus, FaClock, FaUnlock, FaLock } from "react-icons/fa";
import useLocksStore from "stores/useLocksStore";
import { getExplorerUrl } from "utils/explorer";
import { shortenAddress, shortenSignature } from "utils/formatters";
import { notify } from "utils/notifications";

const Lock = () => {
  const today = new Date();
  const thirtyDays = new Date().setDate(today.getDate() + 30);
  const sixtyDays = new Date().setDate(today.getDate() + 60);
  const ninetyDays = new Date().setDate(today.getDate() + 90);
  const oneThousandYears = new Date().setFullYear(today.getFullYear() + 1000);

  const router = useRouter();
  const { program, connection, wallet } = useProgram();
  const { selectedLock, setSelectedLock } = useLocksStore();

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [depositAmount, setDepositAmount] = useState<number>(0);
  const [unlockDate, setUnlockDate] = useState<number>(thirtyDays);

  const isOwner = useMemo(
    () => selectedLock?.user.toBase58() === wallet.publicKey?.toBase58(),
    [selectedLock?.user, wallet.publicKey]
  );

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

      await getLock();
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

      await getLock();
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

  const getLock = async () => {
    try {
      setIsLoading(true);
      const lockPublicKey = new PublicKey(router.query?.lock as string);
      const theLock = await getLockByPublicKey(
        connection,
        program,
        lockPublicKey
      );
      setSelectedLock(theLock);
    } catch (error) {
      setIsLoading(false);
      console.error("-> ~ error:", error);
      notify({
        message: "Lock not found",
        type: "error",
      });
    }
  };

  useEffect(() => {
    if (!router.query?.lock) return;

    if (!selectedLock) {
      getLock();
    }
  }, [router.query?.lock]);

  return (
    <div className="flex flex-col gap-8 items-center justify-center py-10">
      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <>
          <Link
            href={getExplorerUrl(selectedLock.endpoint, selectedLock.publicKey)}
            className="text-5xl font-bold link flex items-center gap-1"
          >
            {shortenAddress(selectedLock.publicKey)}{" "}
            <Score
              lock={selectedLock}
              lockSize="64"
              lockTextSize="2xl"
              lockTextPosition="top-1/2 right-3"
            />
          </Link>

          <div className="flex flex-col gap-8 items-center justify-center">
            <div className="stats bg-white border">
              <div className="stat">
                <div className="stat-title">Token Locked</div>
                <Link
                  href={getExplorerUrl(
                    selectedLock.endpoint,
                    selectedLock.publicKey
                  )}
                  className="stat-value link"
                >
                  {shortenAddress(selectedLock.mint.address)}
                </Link>
                <div className="stat-actions">
                  <Link
                    className="btn btn-xs btn-circle mr-1"
                    href={getExplorerUrl(
                      selectedLock.endpoint,
                      selectedLock.mint.address
                    )}
                    rel="nofollow noreferrer"
                  >
                    <Image
                      src="/solscan.png"
                      width={24}
                      height={24}
                      alt="Solscan.io"
                    />
                  </Link>
                  <Link
                    className="btn btn-xs btn-circle"
                    href={`https://birdeye.so/token/${selectedLock.userTokenAccount.mint.toBase58()}`}
                    rel="nofollow noreferrer"
                  >
                    <Image
                      src="/birdeye.png"
                      width={24}
                      height={24}
                      alt="Birdeye.so"
                    />
                  </Link>
                </div>
              </div>

              <div className="stat">
                <div className="stat-title">Percent Locked</div>
                <div className="stat-value">
                  {selectedLock.displayPercentLocked}
                </div>
                {wallet.connected ? (
                  <div className="stat-actions">
                    <div
                      className="tooltip"
                      data-tip="Deposit more tokens to the lock"
                    >
                      <button
                        disabled={!isOwner}
                        className="btn btn-xs btn-circle mr-2"
                        onClick={() => {
                          setSelectedLock(selectedLock);
                          document
                            .getElementById("deposit_to_lock_modal")
                            // @ts-ignore
                            .showModal();
                        }}
                      >
                        <FaPlus />
                      </button>
                    </div>
                    <div
                      className="tooltip"
                      data-tip="Extend the lock duration"
                    >
                      <button
                        disabled={!isOwner}
                        className="btn btn-xs btn-circle mr-2"
                        onClick={() => {
                          setSelectedLock(selectedLock);
                          document
                            .getElementById("extend_lock_modal")
                            // @ts-ignore
                            .showModal();
                        }}
                      >
                        <FaClock />
                      </button>
                    </div>
                    <div className="tooltip" data-tip="Unlock the tokens">
                      <button
                        disabled={!isOwner || !selectedLock.canUnlock}
                        onClick={() => {
                          setSelectedLock(selectedLock);
                          document
                            .getElementById("unlock_modal")
                            // @ts-ignore
                            .showModal();
                        }}
                        className="btn btn-xs btn-circle mr-2"
                      >
                        <FaUnlock />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="stat-actions">
                    <WalletMultiButton className="sm" />
                  </div>
                )}
              </div>
            </div>

            <div className="stats bg-white border">
              <div className="stat">
                <div className="stat-title">Locked Date</div>
                <div className="stat-value">{selectedLock.displayLockDate}</div>
                <div className="stat-desc">
                  Unlockable in {selectedLock.daysUntilUnlock}
                </div>
                <div className="stat-figure">
                  <FaLock className="w-8 h-8" />
                </div>
              </div>

              <div className="stat">
                <div className="stat-title">Unlock Date</div>
                <div className="stat-value">{selectedLock.displayLockDate}</div>
                <div className="stat-desc">
                  {selectedLock.displayPercentLocked} will become unlockable
                </div>
                <div className="stat-figure">
                  <FaUnlock className="w-8 h-8" />
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      <DepositToLockDialog
        lock={selectedLock}
        depositAmount={depositAmount}
        setDepositAmount={setDepositAmount}
        onSubmit={onDepositToLock}
      />
      <ExtendLockDialog
        lock={selectedLock}
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
  );
};

export default Lock;
