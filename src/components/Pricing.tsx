import React, { useState } from 'react';
import { Check, ArrowRight, Sparkles } from 'lucide-react';
import { PRICING_TIERS } from '../data/siteData';

interface PricingProps {
  onOpenContact: () => void;
}

export const Pricing: React.FC<PricingProps> = ({ onOpenContact }) => {
  const [currency, setCurrency] = useState<'USD' | 'INR'>('USD');

  return (
    <section id="pricing" className="relative z-10 bg-[#030303] py-24 md:py-32 border-t border-[#1a1a1a]">
      <div className="mx-auto max-w-[1440px] px-6 md:px-8">
        {/* Heading & Currency Toggle */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-[0.2em] text-[#777] mb-3">
              <Sparkles className="size-3.5 text-blue-400" />
              <span>Investment & Packages</span>
            </div>
            <h2 className="font-display text-[clamp(40px,5.5vw,72px)] font-medium leading-[1] tracking-[-0.04em] text-[#efefef]">
              Transparent <span className="text-[#ffffff] underline decoration-blue-500/40 decoration-1 underline-offset-8">Pricing</span>
            </h2>
            <p className="mt-4 text-sm md:text-base text-[#888888] max-w-xl">
              Starting points stated up front — every project is quoted transparently based on your unique deliverables.
            </p>
          </div>

          {/* Currency Toggle */}
          <div className="flex items-center gap-1 rounded-full border border-[#2a2a2a] bg-[#101010] p-1">
            <button
              onClick={() => setCurrency('USD')}
              className={`rounded-full px-4 py-1.5 text-xs font-medium transition-all ${
                currency === 'USD'
                  ? 'bg-white text-black font-semibold shadow-sm'
                  : 'text-[#888] hover:text-white'
              }`}
            >
              US Dollars (USD)
            </button>
            <button
              onClick={() => setCurrency('INR')}
              className={`rounded-full px-4 py-1.5 text-xs font-medium transition-all ${
                currency === 'INR'
                  ? 'bg-white text-black font-semibold shadow-sm'
                  : 'text-[#888] hover:text-white'
              }`}
            >
              Indian Rupees (INR)
            </button>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {PRICING_TIERS.map((tier) => {
            const price = currency === 'USD' ? tier.priceUSD : tier.priceINR;

            return (
              <div
                key={tier.id}
                className={`relative flex flex-col justify-between rounded-2xl border p-8 md:p-10 transition-all duration-500 overflow-hidden ${
                  tier.highlighted
                    ? 'border-[#3b82f6]/50 bg-[#0e111a]/80 shadow-[0_20px_60px_rgba(59,130,246,0.15)] ring-1 ring-[#3b82f6]/30'
                    : 'border-[#202020] bg-[#090909]/90 hover:border-[#383838]'
                }`}
              >
                {/* Highlight Tag */}
                {tier.highlighted && (
                  <div className="absolute top-0 right-8 -translate-y-1/2">
                    <span className="rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-white shadow-md">
                      Most Popular
                    </span>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[11px] font-mono uppercase tracking-[0.15em] text-[#888]">
                      {tier.tag}
                    </span>
                  </div>

                  <h3 className="font-display text-2xl md:text-3xl font-medium tracking-tight text-white mb-3">
                    {tier.title}
                  </h3>

                  <p className="text-xs leading-[1.6] text-[#8e8e8e] mb-8 min-h-[40px]">
                    {tier.description}
                  </p>

                  {/* Price */}
                  <div className="flex items-baseline gap-2 mb-8 pb-8 border-b border-[#1c1c1c]">
                    <span className="text-xs text-[#777]">from</span>
                    <span className="font-display text-4xl md:text-5xl font-medium tracking-tight text-white">
                      {price}
                    </span>
                  </div>

                  {/* Features List */}
                  <div className="space-y-3.5 mb-10">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-[#666] block">
                      What's Included
                    </span>
                    {tier.features.map((feat) => (
                      <div key={feat} className="flex items-start gap-2.5 text-xs text-[#cccccc]">
                        <Check className="size-4 shrink-0 text-blue-400 mt-0.5" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* CTAs */}
                <div className="pt-6 border-t border-[#1c1c1c] flex items-center justify-between gap-4">
                  <button
                    onClick={onOpenContact}
                    className={`flex-1 rounded-full py-3 text-xs font-semibold transition-all ${
                      tier.highlighted
                        ? 'bg-white text-black hover:bg-[#e0e0e0] shadow-md'
                        : 'bg-[#181818] text-white border border-[#2b2b2b] hover:bg-white hover:text-black hover:border-transparent'
                    }`}
                  >
                    Start a project
                  </button>
                  <button
                    onClick={onOpenContact}
                    className="flex items-center gap-1 text-xs font-medium text-[#888] hover:text-white transition-colors"
                  >
                    <span>Details</span>
                    <ArrowRight className="size-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
