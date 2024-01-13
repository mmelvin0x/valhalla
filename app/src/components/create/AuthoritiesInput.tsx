import { Authority } from "models/types";
import { Dispatch, SetStateAction, ChangeEvent } from "react";

export default function AuthoritiesInput({
  cancelAuthority,
  setCancelAuthority,
  changeBeneficiaryAuthority,
  setChangeBeneficiaryAuthority,
}: {
  cancelAuthority: Authority;
  setCancelAuthority: Dispatch<SetStateAction<Authority>>;
  changeBeneficiaryAuthority: Authority;
  setChangeBeneficiaryAuthority: Dispatch<SetStateAction<Authority>>;
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
          <option
            value={Authority.Neither}
            selected={cancelAuthority === Authority.Neither}
          >
            Neither
          </option>
          <option
            value={Authority.OnlyFunder}
            selected={cancelAuthority === Authority.OnlyFunder}
          >
            Only Funder
          </option>
          <option
            value={Authority.OnlyBeneficiary}
            selected={cancelAuthority === Authority.OnlyBeneficiary}
          >
            Only Beneficiary
          </option>
          <option
            value={Authority.Both}
            selected={cancelAuthority === Authority.Both}
          >
            Both
          </option>
        </select>
      </div>

      <div className="form-contol w-full">
        <label htmlFor="" className="label">
          <span className="label-text font-bold">Change Beneficiary</span>
          <span className="label-text-alt">Can change recipient</span>
        </label>
        <select
          className="select select-sm select-bordered w-full"
          onChange={(e: ChangeEvent<HTMLSelectElement>) =>
            setChangeBeneficiaryAuthority(+e.target.value as Authority)
          }
        >
          <option
            value={Authority.Neither}
            selected={changeBeneficiaryAuthority === Authority.Neither}
          >
            Neither
          </option>
          <option
            value={Authority.OnlyFunder}
            selected={changeBeneficiaryAuthority === Authority.OnlyFunder}
          >
            Only Funder
          </option>
          <option
            value={Authority.OnlyBeneficiary}
            selected={changeBeneficiaryAuthority === Authority.OnlyBeneficiary}
          >
            Only Beneficiary
          </option>
          <option
            value={Authority.Both}
            selected={changeBeneficiaryAuthority === Authority.Both}
          >
            Both
          </option>
        </select>
      </div>
    </div>
  );
}
