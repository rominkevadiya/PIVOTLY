import { useState } from "react";

interface ReportSectionCardProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export function ReportSectionCard({ title, children, defaultOpen = true }: ReportSectionCardProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <section className="glass-panel rounded-2xl p-6 sm:p-8 animate-fade-in-up hover:shadow-xl transition-all duration-300">
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="w-full flex justify-between items-center text-left focus:outline-none group"
      >
        <h2 className="text-sm font-bold uppercase tracking-widest text-moss text-gradient mb-0">{title}</h2>
        <svg 
          className={`w-5 h-5 text-moss/60 transform transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      <div 
        className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100 mt-5' : 'grid-rows-[0fr] opacity-0 mt-0'}`}
      >
        <div className="overflow-hidden space-y-4 text-[15px] leading-relaxed text-ink/80 font-medium">
          {children}
        </div>
      </div>
    </section>
  );
}
