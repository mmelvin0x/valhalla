import * as anchor from "@coral-xyz/anchor";

import { Config, PROGRAM_ID, ValhallaConfig, getPDAs } from "@valhalla/lib";
import { IconCalendarDollar, IconReceipt, IconSend } from "@tabler/icons-react";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { useEffect, useMemo, useState } from "react";

import Image from "next/image";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import useProgram from "@/src/hooks/useProgram";
import { useValhallaStore } from "@/src/stores/useValhallaStore";

export default function DashboardStats() {
  const { connection, wallet } = useProgram();
  const { vaults, setConfig } = useValhallaStore();

  const [odinBalance, setOdinBalance] = useState<number | null>(null);
  const [solBalance, setSolBalance] = useState<number | null>(null);

  const createdLocksCount = useMemo(() => {
    return vaults.created.filter((v) => v.nextPayoutDate < new Date()).length;
  }, [vaults.created]);

  const receivableLocksCount = useMemo(() => {
    return vaults.recipient.filter((v) => v.nextPayoutDate < new Date()).length;
  }, [vaults.recipient]);

  const nextCreatedVaultDisbursement = useMemo(() => {
    const next = vaults.created
      .map((v) => ({
        time: v.nextPayoutDate,
        display: v.nextPayoutShortDate,
      }))
      .sort((a, b) => a.time.getTime() - b.time.getTime());
    return next[0]?.time;
  }, [vaults.created]);

  const nextReceivableVaultDisbursement = useMemo(() => {
    const next = vaults.recipient
      .map((v) => ({
        time: v.nextPayoutDate,
        display: v.nextPayoutShortDate,
      }))
      .sort((a, b) => a.time.getTime() - b.time.getTime());
    return next[0]?.time;
  }, [vaults.recipient]);

  useEffect(() => {
    (async () => {
      if (wallet.publicKey) {
        const { config: configKey } = getPDAs(PROGRAM_ID);
        const config = await Config.fromAccountAddress(connection, configKey);
        setConfig(
          new ValhallaConfig(
            config.admin,
            config.devTreasury,
            config.daoTreasury,
            config.governanceTokenMintKey,
            new anchor.BN(config.devFee),
            new anchor.BN(config.autopayMultiplier),
            new anchor.BN(config.tokenFeeBasisPoints),
            new anchor.BN(config.governanceTokenAmount)
          )
        );

        const userOdinTokenAccountKey = getAssociatedTokenAddressSync(
          new PublicKey(config.governanceTokenMintKey),
          wallet.publicKey
        );

        try {
          const odinBalance = await connection.getTokenAccountBalance(
            userOdinTokenAccountKey
          );

          setOdinBalance(odinBalance.value.uiAmount);
        } catch (e) {
          setOdinBalance(0);
        }

        const userSolBalance = await connection.getBalance(wallet.publicKey);
        setSolBalance(Number((userSolBalance / LAMPORTS_PER_SOL).toFixed(2)));
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="stats stats-vertical">
        <div className="stat">
          <div className="stat-title">Created Vault Unlocks</div>
          <div className="stat-value">{createdLocksCount}</div>
          <div className="stat-figure hidden sm:block rounded-full">
            {nextCreatedVaultDisbursement <= new Date() && (
              <IconSend className="w-12 h-12 text-secondary" />
            )}

            {nextCreatedVaultDisbursement > new Date() && (
              <IconCalendarDollar className="w-12 h-12" />
            )}
          </div>
          <div className="stat-desc">
            Next unlock: {nextCreatedVaultDisbursement?.toLocaleString()}
          </div>
        </div>
      </div>

      <div className="stats stats-vertical">
        <div className="stat">
          <div className="stat-title">Receivable Vault Unlocks</div>
          <div className="stat-value">{receivableLocksCount}</div>
          <div className="stat-figure hidden sm:block rounded-full">
            {nextReceivableVaultDisbursement <= new Date() && (
              <IconReceipt className="w-12 h-12 text-accent" />
            )}

            {nextReceivableVaultDisbursement > new Date() && (
              <IconCalendarDollar className="w-12 h-12" />
            )}
          </div>
          <div className="stat-desc">
            Next unlock: {nextReceivableVaultDisbursement?.toLocaleString()}
          </div>
        </div>
      </div>

      <div className="stats stats-vertical">
        <div className="stat">
          <div className="stat-title">Balances</div>
          <div className="stat-value flex flex-col gap-2">
            <span className="flex items-center gap-2">
              {" "}
              {odinBalance}{" "}
              <Image src="/odin.png" width={32} height={32} alt="$ODIN" />
            </span>

            <span className="flex items-center gap-2">
              {" "}
              {solBalance}{" "}
              <Image
                className="rounded-full"
                src="/sol.png"
                width={32}
                height={32}
                alt="SOL"
              />
            </span>
          </div>
          <div className="stat-figure hidden sm:block cursor-pointer rounded-full">
            <Image src="/odin.png" width={64} height={64} alt="$ODIN" />
          </div>
        </div>
      </div>
    </section>
  );
}
