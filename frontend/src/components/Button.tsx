interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
}

export function Button({ className = "", variant = "primary", ...props }: ButtonProps) {
  const base =
    "inline-flex items-center justify-center rounded-xl px-6 py-3.5 text-[15px] font-bold tracking-wide transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-60 active:scale-95";
  const variants = {
    primary: "bg-ink text-white hover:bg-moss hover:shadow-[0_8px_30px_rgb(49,92,77,0.3)] hover:-translate-y-0.5",
    secondary: "glass-panel text-ink hover:text-moss hover:border-moss/30",
  };

  return <button className={`${base} ${variants[variant]} ${className}`} {...props} />;
}
