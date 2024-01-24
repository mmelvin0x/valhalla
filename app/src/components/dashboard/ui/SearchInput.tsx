import { FaSearch } from "react-icons/fa";

export default function SearchInput({ formik }) {
  return (
    <form
      onSubmit={formik.handleSubmit}
      onReset={formik.handleReset}
      className="flex flex-col sm:flex-row gap-2"
    >
      <div className="form-control">
        {!!formik.errors.search && (
          <label htmlFor="search" className="label">
            <span className="label-text-alt text-error">
              {formik.errors.search}
            </span>
          </label>
        )}
        <input
          type="text"
          name="search"
          placeholder="Search by name"
          className={`input input-bordered input-sm ${formik.errors.search ? "input-error" : ""}`}
          value={formik.values.search}
          onChange={formik.handleChange}
        />
      </div>

      <button className="btn btn-primary btn-sm" type="submit">
        <FaSearch /> Search
      </button>
    </form>
  );
}
