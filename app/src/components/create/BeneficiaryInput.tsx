import { isPublicKey } from "@metaplex-foundation/umi";
import useProgram from "hooks/useProgram";
import { useMemo, ChangeEvent, Dispatch, SetStateAction } from "react";
import { shortenAddress } from "utils/formatters";

export default function BeneficiaryInput({
  beneficiary,
  setBeneficiary,
}: {
  beneficiary: string;
  setBeneficiary: Dispatch<SetStateAction<string>>;
}) {
  const { wallet } = useProgram();
  const beneficiaryPlaceholder = useMemo(
    () => shortenAddress(wallet?.publicKey),
    [wallet]
  );

  return (
    <div className="form-control">
      <label htmlFor="" className="label">
        <span className="label-text font-bold">Beneficiary</span>
        {beneficiary && !isPublicKey(beneficiary) && (
          <span className="label-text-alt text-error">
            Not a valid Solana address
          </span>
        )}
      </label>
      <input
        type="text"
        className="input input-sm input-bordered"
        placeholder={beneficiaryPlaceholder}
        value={beneficiary}
        onChange={(e: ChangeEvent<HTMLInputElement>) =>
          setBeneficiary(e.target.value)
        }
      />
    </div>
  );
}
