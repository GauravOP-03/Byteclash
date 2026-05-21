import React from "react";

interface cardComponentProp {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}
const CardComponent = ({ children, title, subtitle }: cardComponentProp) => {
  return (
    <>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[100px] pointer-events-none z-0">
        <div className="w-[600px] h-[600px] bg-primary/10 rounded-full blur-[100px] animate-breathe"></div>
      </div>
      <main className="w-full max-w-[480px] px-md relative z-10">
        <div className="bg-bg-surface border-[0.5px] border-border-subtle p-xl flex flex-col gap-lg shadow-[0_0_40px_rgba(0,0,0,0.8)] relative">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/40 to-transparent"></div>
          <div className="flex flex-col items-center gap-xs text-center mb-xs">
            <h1 className="font-display text-display text-primary uppercase tracking-tighter">
              {title}
            </h1>
            <span className="font-section-tag text-section-tag text-text-muted uppercase tracking-widest">
              {subtitle}
            </span>
          </div>
          {children}
        </div>
        <div className="mt-lg flex justify-center items-center gap-xs font-section-tag text-section-tag text-text-muted uppercase">
          <span className="w-[6px] h-[6px] rounded-full bg-verdict-ac animate-pulse shadow-[0_0_8px_rgba(104,211,145,0.6)]"></span>
          Terminal Secure Link V_1.0.4
        </div>
      </main>
    </>
  );
};
export default CardComponent;
