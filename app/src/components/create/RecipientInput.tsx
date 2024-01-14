import { isPublicKey } from "@metaplex-foundation/umi";
import useProgram from "hooks/useProgram";
import { useMemo, ChangeEvent, Dispatch, SetStateAction } from "react";
import { shortenAddress } from "utils/formatters";

export default function RecipientInput({
  recipient,
  setRecipient,
}: {
  recipient: string;
  setRecipient: Dispatch<SetStateAction<string>>;
}) {
  const { wallet } = useProgram();
  const recipientPlaceholder = useMemo(
    () => shortenAddress(wallet?.publicKey),
    [wallet]
  );

  return (
    <div className="form-control">
      <label htmlFor="" className="label">
        <span className="label-text font-bold">Recipient</span>
        {recipient && !isPublicKey(recipient) && (
          <span className="label-text-alt text-error">
            Not a valid Solana address
          </span>
        )}
      </label>
      <input
        type="text"
        className="input input-sm input-bordered"
        placeholder={recipientPlaceholder}
        value={recipient}
        onChange={(e: ChangeEvent<HTMLInputElement>) => {
          setRecipient(e.target.value);
        }}
      />
    </div>
  );
}
