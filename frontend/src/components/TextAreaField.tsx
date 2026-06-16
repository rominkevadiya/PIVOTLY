interface TextAreaFieldProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  helperText?: string;
}

export function TextAreaField({ label, helperText, id, ...props }: TextAreaFieldProps) {
  return (
    <label htmlFor={id} className="block">
      <span className="mb-2 block text-sm font-semibold text-ink">{label}</span>
      <textarea
        id={id}
        className="min-h-48 w-full resize-y rounded-lg border border-ink/15 bg-white px-4 py-3 text-base leading-7 outline-none transition placeholder:text-ink/35 focus:border-moss focus:ring-4 focus:ring-moss/10"
        {...props}
      />
      {helperText ? <span className="mt-2 block text-sm text-ink/60">{helperText}</span> : null}
    </label>
  );
}
