import "../styles/forms.css";

function FormField({ label, id, error, hint, ...inputProps }) {
  return (
    <div className={`form-field${error ? " field-invalid" : ""}`}>
      <label htmlFor={id}>{label}</label>
      <input id={id} name={id} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} {...inputProps} />
      {hint && !error && <small>{hint}</small>}
      {error && <small id={`${id}-error`} className="field-error">{error}</small>}
    </div>
  );
}

export default FormField;
