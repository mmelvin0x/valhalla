import AuthoritiesInput from "./AuthoritiesInput";
import CliffPaymentAmountInput from "./CliffPaymentAmountInput";
import PayoutIntervalInput from "./PayoutIntervalInput";
import RecipientInput from "./RecipientInput";
import SelectTokenInput from "./SelectTokenInput";
import StartDateInput from "./StartDateInput";
import VestingEndDateInput from "./VestingEndDateInput";
import { VestingType } from "program";

export default function CreateForm({
  formik,
  vestingType,
}: {
  formik;
  vestingType: VestingType;
}) {
  return (
    <form onReset={formik.handleReset} onSubmit={formik.handleSubmit}>
      <div className="form-control">
        <label htmlFor="" className="label">
          <span className="label-text font-bold">Name</span>
        </label>
        <input
          type="text"
          name="name"
          className={`input input-bordered  ${formik.errors.name ? "input-error" : ""}`}
          placeholder="You can search by this name later"
          maxLength={32}
          value={formik.values.name}
          onChange={formik.handleChange}
        />
        {formik.errors.name && (
          <label htmlFor="" className="label">
            <span className="label-text-alt text-error">
              {formik.errors.name}
            </span>
          </label>
        )}
      </div>

      {/* TODO-CHECK: resolve .sol addresses and add validations */}
      {(vestingType === VestingType.VestingSchedule ||
        vestingType === VestingType.ScheduledPayment) && (
        <RecipientInput
          values={formik.values}
          handler={formik.handleChange}
          errors={formik.errors}
        />
      )}

      {/* TODO: replace default image with "UNK" */}
      <SelectTokenInput
        values={formik.values}
        handler={formik.handleChange}
        errors={formik.errors}
        setFieldValue={formik.setFieldValue}
      />

      {vestingType === VestingType.VestingSchedule && (
        <CliffPaymentAmountInput
          values={formik.values}
          handler={formik.handleChange}
          errors={formik.errors}
        />
      )}

      {vestingType === VestingType.VestingSchedule && (
        <StartDateInput
          values={formik.values}
          handler={formik.handleChange}
          errors={formik.errors}
        />
      )}

      <VestingEndDateInput
        values={formik.values}
        handler={formik.handleChange}
        errors={formik.errors}
      />

      {vestingType === VestingType.VestingSchedule && (
        <PayoutIntervalInput
          values={formik.values}
          handler={formik.handleChange}
          errors={formik.errors}
        />
      )}

      {(vestingType === VestingType.VestingSchedule ||
        vestingType === VestingType.ScheduledPayment) && (
        <AuthoritiesInput
          values={formik.values}
          handler={formik.handleChange}
          errors={formik.errors}
        />
      )}

      <div className="card-actions mt-8">
        <button className="btn btn-secondary" type="reset">
          Reset
        </button>
        <button className="btn btn-accent" type="submit">
          Submit
        </button>
      </div>
    </form>
  );
}
