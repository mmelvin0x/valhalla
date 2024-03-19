import { FormikErrors, FormikValues } from "formik";
import { NameRegistryState, getDomainKeySync } from "@bonfida/spl-name-service";

import { ChangeEventHandler } from "react";
import { ICreateForm } from "utils/interfaces";
import { PublicKey } from "@solana/web3.js";
import useProgram from "program/useProgram";

export default function RecipientInput({
  values,
  handler,
  errors,
  disabled,
}: {
  disabled: boolean;
  values: FormikValues;
  handler: ChangeEventHandler<any>;
  errors: FormikErrors<ICreateForm>;
}) {
  const { recipient } = values;
  const { connection } = useProgram();

  // TODO: Add support for .sol addresses
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
      </label>

      <input
        type="text"
        name="recipient"
        className={`input  input-bordered ${errors.recipient && "input-error"}`}
        placeholder={"Public Key of the recipient"}
        value={recipient}
        onChange={handler}
        disabled={disabled}
      />

      {!!errors.recipient && (
        <label htmlFor="" className="label">
          <span className="text-error label-text-alt">{errors.recipient}</span>
        </label>
      )}
    </div>
  );
}
