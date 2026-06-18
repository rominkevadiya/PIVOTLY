import { useState } from "react";

interface ReportSectionCardProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  forceOpen?: boolean;
}

export function ReportSectionCard({ title, children, defaultOpen = true, forceOpen = false }: ReportSectionCardProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const isActuallyOpen = isOpen || forceOpen;

  return (
    <section className="glass-panel rounded-2xl p-6 sm:p-8 animate-fade-in-up hover:shadow-xl transition-all duration-300">
      {/* Toggle button — kept visible in print so the h2 title renders */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center text-left focus:outline-none group print:cursor-default"
      >
        <h2 className="text-sm font-bold uppercase tracking-widest text-moss text-gradient mb-0">{title}</h2>
        {/* Chevron icon: hidden in print */}
        <svg
          className={`w-5 h-5 text-moss/60 transform transition-transform duration-300 print:hidden ${isActuallyOpen ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/*
        Content wrapper.
        On screen: grid-rows animation collapses/expands the content.
        In print:  the CSS in index.css forces this entire div to
                   display:block with height:auto and overflow:visible,
                   so content is always fully visible regardless of state.
      */}
      <div
        className={`grid transition-all duration-300 ease-in-out ${
          isActuallyOpen ? "grid-rows-[1fr] opacity-100 mt-5" : "grid-rows-[0fr] opacity-0 mt-0"
        }`}
      >
        <div className="overflow-hidden space-y-4 text-[15px] leading-relaxed text-ink/80 font-medium">
          {children}
        </div>
      </div>
    </section>
  );
}
