interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
}

export function Button({ className = "", variant = "primary", ...props }: ButtonProps) {
  const base =
    "inline-flex items-center justify-center rounded-md px-5 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60";
  const variants = {
    primary: "bg-ink text-white hover:bg-moss",
    secondary: "border border-ink/15 bg-white text-ink hover:border-moss hover:text-moss",
  };

  return <button className={`${base} ${variants[variant]} ${className}`} {...props} />;
}
