interface TextAreaFieldProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  helperText?: string;
}

export function TextAreaField({ label, helperText, id, ...props }: TextAreaFieldProps) {
  return (
    <label htmlFor={id} className="block">
      <span className="mb-2 block text-sm font-bold uppercase tracking-wider text-ink/70">{label}</span>
      <textarea
        id={id}
        className="premium-input min-h-48 resize-y text-base leading-relaxed placeholder:text-ink/35"
        {...props}
      />
      {helperText ? <span className="mt-2 block text-xs font-medium text-ink/50">{helperText}</span> : null}
    </label>
  );
}
