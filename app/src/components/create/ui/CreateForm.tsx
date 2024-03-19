import AuthoritiesInput from "./AuthoritiesInput";
import PayoutIntervalInput from "./PayoutIntervalInput";
import RecipientInput from "./RecipientInput";
import SelectTokenInput from "./SelectTokenInput";
import StartDateInput from "./StartDateInput";
import VestingEndDateInput from "./VestingEndDateInput";

export default function CreateForm({ formik }: { formik }) {
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
          disabled={formik.isSubmitting}
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
      <RecipientInput
        disabled={formik.isSubmitting}
        values={formik.values}
        handler={formik.handleChange}
        errors={formik.errors}
      />

      {/* TODO: replace default image with "UNK" */}
      <SelectTokenInput
        disabled={formik.isSubmitting}
        values={formik.values}
        handler={formik.handleChange}
        errors={formik.errors}
        setFieldValue={formik.setFieldValue}
      />

      <StartDateInput
        disabled={formik.isSubmitting}
        values={formik.values}
        handler={(e) => {
          formik.handleChange(e);
        }}
        errors={formik.errors}
      />

      <VestingEndDateInput
        disabled={formik.isSubmitting}
        values={formik.values}
        handler={formik.handleChange}
        errors={formik.errors}
      />

      <PayoutIntervalInput
        disabled={formik.isSubmitting}
        values={formik.values}
        handler={formik.handleChange}
        errors={formik.errors}
      />

      <AuthoritiesInput
        disabled={formik.isSubmitting}
        values={formik.values}
        handler={formik.handleChange}
        errors={formik.errors}
      />

      <div className="card-actions mt-8">
        <button
          className="btn btn-secondary"
          type="reset"
          disabled={formik.isSubmitting}
        >
          Reset
        </button>
        <button
          className="btn btn-accent"
          type="submit"
          disabled={formik.isSubmitting}
        >
          Submit
        </button>
      </div>
    </form>
  );
}
