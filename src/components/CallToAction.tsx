import React from 'react';
import { Sparkles, Calendar } from 'lucide-react';

interface CallToActionProps {
  onOpenContact: () => void;
  onOpenSchedule: () => void;
}

export const CallToAction: React.FC<CallToActionProps> = ({ onOpenContact, onOpenSchedule }) => {
  return (
    <section className="relative z-10 bg-[#030303] pt-24 pb-20 md:pt-36 md:pb-28 overflow-hidden border-t border-[#1a1a1a]">
      {/* Ambient background glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-1/2 -z-10 h-[400px] w-[700px] -translate-x-1/2 -translate-y-1/2 opacity-20 blur-[130px] rounded-full"
        style={{
          background: 'radial-gradient(circle, #3b82f6 0%, #1e1b4b 60%, transparent 100%)',
        }}
      />

      <div className="mx-auto max-w-[1440px] px-6 md:px-8 text-center">
        <h2 className="font-display text-[clamp(44px,6.5vw,84px)] font-medium leading-[1] tracking-[-0.05em] text-[#efefef]">
          Create Bold.<br />
          <span className="text-[#888888]">Deliver Better.</span>
        </h2>

        <p className="mt-6 text-base md:text-lg text-[#888888] max-w-xl mx-auto">
          Ready to elevate your digital presence? Let's craft a website that sets your brand apart.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={onOpenContact}
            className="inline-flex h-12 items-center justify-center rounded-full bg-white px-8 text-sm font-semibold text-black transition-all duration-300 hover:bg-[#eaeaea] hover:scale-105 shadow-[0_0_30px_rgba(255,255,255,0.2)]"
          >
            Start a project
          </button>
          <button
            onClick={onOpenSchedule}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-[#2b2b2b] bg-[#121212] px-6 text-sm font-medium text-[#dfdfdf] transition-all hover:border-[#444] hover:bg-[#1a1a1a] hover:text-white"
          >
            <Calendar className="size-4 text-blue-400" />
            <span>Book a 15-min call</span>
          </button>
        </div>
      </div>
    </section>
  );
};
