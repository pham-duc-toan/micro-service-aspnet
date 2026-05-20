export function TextField({ label, value, onChange, type = 'text', placeholder, readOnly = false }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        readOnly={readOnly}
        onChange={(event) => onChange?.(event.target.value)}
      />
    </label>
  )
}

export function TextAreaField({ label, value, onChange }) {
  return (
    <label className="field wide">
      <span>{label}</span>
      <textarea rows={4} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  )
}

export function SelectField({ label, value, onChange, options, icon }) {
  return (
    <label className="field">
      <span>{label}</span>
      <div className="selectShell">
        {icon ? <span className="selectIcon">{icon}</span> : null}
        <select value={value} onChange={(event) => onChange(event.target.value)}>
          {options.map(([optionValue, optionLabel]) => (
            <option key={optionValue} value={optionValue}>
              {optionLabel}
            </option>
          ))}
        </select>
      </div>
    </label>
  )
}
