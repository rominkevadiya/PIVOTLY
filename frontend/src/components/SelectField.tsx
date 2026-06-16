import { SelectHTMLAttributes } from "react";

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  id: string;
  label: string;
  options: { label: string; value: string }[];
  helperText?: string;
}

export function SelectField({ id, label, options, helperText, className = "", ...props }: SelectFieldProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      <label htmlFor={id} className="block text-sm font-semibold text-ink/80 tracking-wide uppercase">
        {label}
      </label>
      <div className="relative">
        <select
          id={id}
          className="block w-full appearance-none rounded-xl border border-moss/20 bg-white/50 px-4 py-3.5 text-ink placeholder-ink/40 shadow-sm backdrop-blur-md focus:border-moss focus:outline-none focus:ring-4 focus:ring-moss/10 sm:text-sm transition-all duration-300"
          {...props}
        >
          <option value="" disabled>Select an option</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-ink/50">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      {helperText ? (
        <p className="text-sm font-medium text-ink/60">{helperText}</p>
      ) : null}
    </div>
  );
}
