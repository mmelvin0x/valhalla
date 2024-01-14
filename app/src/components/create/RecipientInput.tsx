import { isPublicKey } from "@metaplex-foundation/umi";
import useProgram from "hooks/useProgram";
import { useMemo, ChangeEvent, Dispatch, SetStateAction } from "react";
import { shortenAddress } from "utils/formatters";
import { NameRegistryState, getDomainKeySync } from "@bonfida/spl-name-service";
import { PublicKey } from "@solana/web3.js";
import { FaAddressBook } from "react-icons/fa";

export default function RecipientInput({
  recipient,
  setRecipient,
}: {
  recipient: string;
  setRecipient: Dispatch<SetStateAction<string>>;
}) {
  const { wallet, connection } = useProgram();
  const recipientPlaceholder = useMemo(
    () => shortenAddress(wallet?.publicKey),
    [wallet]
  );

  const getPublicKeyFromSolDomain = async (
    domain: string
  ): Promise<PublicKey | null> => {
    const { pubkey } = getDomainKeySync(domain);
    const owner = (await NameRegistryState.retrieve(connection, pubkey))
      .registry.owner;

    return owner;
  };

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
        onChange={async (e: ChangeEvent<HTMLInputElement>) => {
          if (isPublicKey(e.target.value)) {
            setRecipient(e.target.value);
            return;
          }

          if (e.target.value.endsWith(".sol")) {
            const publicKey = await getPublicKeyFromSolDomain(e.target.value);
            if (publicKey) {
              setRecipient(publicKey.toBase58());
              return;
            }
          }

          setRecipient(e.target.value);
        }}
      />
    </div>
  );
}
