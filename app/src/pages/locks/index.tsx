import { FC, useEffect, useMemo, useState } from "react";
import useProgram from "hooks/useProgram";
import { Lock } from "program";
import { PublicKey } from "@solana/web3.js";
import BN from "bn.js";
import { shortenAddress, shortenNumber } from "utils/formatters";
import { FaLink } from "react-icons/fa";
import Link from "next/link";
import { getExplorerUrl } from "utils/explorer";

const Locks: FC = () => {
  const { program, provider } = useProgram();
  const [locker, setLocker] = useState<{
    publicKey: PublicKey;
    account: { admin: PublicKey; fee: BN; treasury: PublicKey };
  }>(null);
  const [locks, setLocks] = useState<Lock[]>([]);
  const numLocks = useMemo(() => shortenNumber(locks.length, 0), [locks]);
  const lockerDisplayAddress = useMemo(
    () => shortenAddress(locker?.publicKey),
    [locker]
  );

  useEffect(() => {
    if (program?.programId) {
      (async () => {
        const locker = (await program.account.locker.all())?.[1];
        console.log("-> ~ locker:", locker.publicKey.toString());
        setLocker(locker);
        setLocks(locks as unknown as Lock[]);
      })();
    }
  }, []);

  return (
    <div className="flex flex-col gap-8 items-center justify-center py-10">
      <h1 className="text-6xl font-bold relative">
        Locks{" "}
        <Link
          target="_blank"
          rel="noreferrer"
          href={getExplorerUrl(
            provider.connection.rpcEndpoint,
            locker?.publicKey
          )}
          className="badge badge-primary absolute"
        >
          <span className="flex gap-2 items-center">
            {lockerDisplayAddress} <FaLink />
          </span>
        </Link>
      </h1>

      {!locks.length && (
        <p className="prose">
          No locks created yet! Come back during the 🐂 😭
        </p>
      )}
    </div>
  );
};

export default Locks;
