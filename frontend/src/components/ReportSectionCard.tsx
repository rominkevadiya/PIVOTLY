interface ReportSectionCardProps {
  title: string;
  children: React.ReactNode;
}

export function ReportSectionCard({ title, children }: ReportSectionCardProps) {
  return (
    <section className="rounded-lg border border-ink/10 bg-white p-5 shadow-panel">
      <h2 className="mb-4 text-base font-semibold uppercase tracking-normal text-moss">{title}</h2>
      <div className="space-y-3 text-sm leading-6 text-ink/80">{children}</div>
    </section>
  );
}
