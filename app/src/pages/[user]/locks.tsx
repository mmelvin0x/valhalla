import { FC, useEffect, useState } from "react";
import useProgram from "hooks/useProgram";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { ILock } from "program/liquidity_locker";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
import { lockDiscriminator } from "program";

const Locks: FC = () => {
  const { wallet, program } = useProgram();
  const [locks, setLocks] = useState<ILock[]>([]);

  useEffect(() => {
    if (program?.programId) {
      (async () => {
        const locks = await program.account.lock.all([
          {
            memcmp: {
              offset: 8 + 32,
              bytes: bs58.encode(lockDiscriminator),
            },
          },
        ]);
        // TODO: User locks should be set on global state
        setLocks(locks as unknown as ILock[]);
      })();
    }
  }, []);

  return (
    <div className="flex flex-col gap-8 items-center justify-center py-10">
      <h1 className="text-6xl font-bold">Locks</h1>

      {!wallet.connected && (
        <div className="flex flex-col items-center gap-6">
          <p className="prose">Connect your wallet to get started</p>
          <WalletMultiButton />
        </div>
      )}

      {!locks.length && (
        <p className="prose">
          No locks created yet! Come back during the 🐂 😭
        </p>
      )}
    </div>
  );
};

export default Locks;
