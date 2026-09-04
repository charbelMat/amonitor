import { forwardRef, type InputHTMLAttributes, type SelectHTMLAttributes } from 'react';

const FIELD_CLASSES =
  'bg-bg border border-border rounded-md px-3 py-2 text-sm text-ink placeholder:text-faint focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/50 transition-colors';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, id, className = '', ...props },
  ref,
) {
  return (
    <label className="flex flex-col gap-1.5 text-sm" htmlFor={id}>
      {label && <span className="text-xs font-medium text-muted">{label}</span>}
      <input ref={ref} id={id} className={`${FIELD_CLASSES} ${className}`} {...props} />
      {hint && <span className="text-xs text-faint">{hint}</span>}
    </label>
  );
});

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
}

export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(function SelectField(
  { label, id, className = '', children, ...props },
  ref,
) {
  return (
    <label className="flex flex-col gap-1.5 text-sm" htmlFor={id}>
      {label && <span className="text-xs font-medium text-muted">{label}</span>}
      <select ref={ref} id={id} className={`${FIELD_CLASSES} ${className}`} {...props}>
        {children}
      </select>
    </label>
  );
});
