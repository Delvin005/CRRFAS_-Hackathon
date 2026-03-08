/**
 * Reusable form field wrapper with label and error display.
 * Usage: <FormField label="Name" error={errors.name}><input .../></FormField>
 */
export function FormField({ label, error, required, children }) {
  return (
    <div className="space-y-1">
      <label className="block text-xs font-medium text-neutral-400">
        {label}{required && <span className="text-accent-red ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-accent-red">{error}</p>}
    </div>
  )
}

/**
 * Reusable select field.
 */
export function SelectField({ label, required, error, children, ...props }) {
  return (
    <FormField label={label} error={error} required={required}>
      <select className="input text-neutral-50" {...props}>
        {children}
      </select>
    </FormField>
  )
}

/**
 * Reusable text/number input.
 */
export function InputField({ label, required, error, ...props }) {
  return (
    <FormField label={label} error={error} required={required}>
      <input className="input" {...props} />
    </FormField>
  )
}
