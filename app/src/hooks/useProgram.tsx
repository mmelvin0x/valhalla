import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Valhalla, IDL } from "program/_valhalla";
import { useMemo } from "react";
import * as anchor from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";

const useProgram = () => {
  const wallet = useWallet();
  const { connection } = useConnection();
  const programId = new PublicKey(
    "VHDaKPFJHN3c4Vcb1441HotazGQFa4kGoMik9HMRVQh"
  );
  const provider = new anchor.AnchorProvider(connection, wallet, {});
  const program = useMemo(
    () => new anchor.Program<Valhalla>(IDL, programId, provider),
    [wallet, connection, provider]
  );

  return { program, provider, wallet, connection };
};

export default useProgram;
