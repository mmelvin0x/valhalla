import { NameRegistryState, getDomainKeySync } from "@bonfida/spl-name-service";
import { isPublicKey } from "@metaplex-foundation/umi";
import { PublicKey } from "@solana/web3.js";
import useProgram from "program/useProgram";
import { ChangeEventHandler, useMemo } from "react";
import { shortenAddress } from "utils/formatters";
import { FormikValues, FormikErrors } from "formik";
import { ICreateForm } from "utils/interfaces";

export default function RecipientInput({
  values,
  handler,
  errors,
}: {
  values: FormikValues;
  handler: ChangeEventHandler<any>;
  errors: FormikErrors<ICreateForm>;
}) {
  const { recipient } = values;
  const { wallet, connection } = useProgram();
  const recipientPlaceholder = useMemo(
    () => shortenAddress(wallet?.publicKey),
    [wallet],
  );

  const getPublicKeyFromSolDomain = async (
    domain: string,
  ): Promise<PublicKey | null> => {
    try {
      const { pubkey } = getDomainKeySync(domain);
      const owner = (await NameRegistryState.retrieve(connection, pubkey))
        .registry.owner;

      return owner;
    } catch (err) {
      return null;
    }
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
        name="recipient"
        className="input input-sm input-bordered"
        placeholder={recipientPlaceholder}
        value={recipient}
        onChange={handler}
      />
      {!!errors.recipient && (
        <span className="text-error label-text-alt">{errors.recipient}</span>
      )}
    </div>
  );
}
