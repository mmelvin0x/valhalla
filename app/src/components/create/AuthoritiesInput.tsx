import { Authority } from "program/generated/types/Authority";
import { Dispatch, SetStateAction, ChangeEvent } from "react";

export default function AuthoritiesInput({
  cancelAuthority,
  setCancelAuthority,
  changeRecipientAuthority,
  setChangeRecipientAuthority,
}: {
  cancelAuthority: Authority;
  setCancelAuthority: Dispatch<SetStateAction<Authority>>;
  changeRecipientAuthority: Authority;
  setChangeRecipientAuthority: Dispatch<SetStateAction<Authority>>;
}) {
  return (
    <div className="flex flex-col xl:flex-row items-center justify-between gap-2">
      <div className="form-contol w-full">
        <label htmlFor="" className="label">
          <span className="label-text font-bold">Cancel Authority</span>
          <span className="label-text-alt">Can cancel the lock</span>
        </label>
        <select
          value={cancelAuthority}
          className="select select-sm select-bordered w-full"
          onChange={(e: ChangeEvent<HTMLSelectElement>) =>
            setCancelAuthority(+e.target.value as Authority)
          }
        >
          <option value={Authority.Neither}>Neither</option>
          <option value={Authority.Funder}>Only Funder</option>
          <option value={Authority.Recipient}>Only Recipient</option>
          <option value={Authority.Both}>Both</option>
        </select>
      </div>

      <div className="form-contol w-full">
        <label htmlFor="" className="label">
          <span className="label-text font-bold">Change Recipient</span>
          <span className="label-text-alt">Can change recipient</span>
        </label>
        <select
          value={changeRecipientAuthority}
          className="select select-sm select-bordered w-full"
          onChange={(e: ChangeEvent<HTMLSelectElement>) =>
            setChangeRecipientAuthority(+e.target.value as Authority)
          }
        >
          <option value={Authority.Neither}>Neither</option>
          <option value={Authority.Funder}>Only Funder</option>
          <option value={Authority.Recipient}>Only Recipient</option>
          <option value={Authority.Both}>Both</option>
        </select>
      </div>
    </div>
  );
}
