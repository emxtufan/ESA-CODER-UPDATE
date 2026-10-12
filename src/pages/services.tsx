import {IconCloud} from '@/components/services/IconCloud';
import Link from '@/components/Link';
import PageTitle from '@/components/PageTitle';
import RevealBatch from '@/components/motion/RevealBatch';
import ServicesBackdrop from '@/components/services/ServicesBackdrop';

import {text} from '@/lib/text';

const $t = text("/services");

// Converted 1:1 from the RSC payload of /services.
export default function Page_services() {
  return (
    <>
      <main className="relative isolate">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: "{\"@context\":\"https://schema.org\",\"@type\":\"BreadcrumbList\",\"itemListElement\":[{\"@type\":\"ListItem\",\"position\":1,\"name\":\"Home\",\"item\":\"https://visuvate.com/\"},{\"@type\":\"ListItem\",\"position\":2,\"name\":\"Services\",\"item\":\"https://visuvate.com/services\"}]}" }} />
        <ServicesBackdrop className="fixed inset-0 -z-10" />
        <span aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-[280px]" style={{ background: "linear-gradient(180deg, transparent 0%, var(--vv-bg) 92%)" }} />
        <PageTitle lead={$t("our")} trail={$t("services")}>
          <p className="mx-auto mt-8 max-w-[620px] text-center text-lead leading-[1.6] text-fg-muted">
            {$t("ten-disciplines-one-studio-every-engagement")}
          </p>
        </PageTitle>
        <RevealBatch className="mx-auto max-w-[1425px] px-6 pb-[clamp(80px,10vw,140px)] md:px-8">
          <div className="grid items-stretch gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:[&>*:last-child:nth-child(3n+1)]:col-start-2">
            <Link data-reveal href="/services/crafted-websites" className="group relative flex flex-col gap-3 rounded-[6px] border border-fg/12 bg-bg/30 p-[6px] pb-3 backdrop-blur-[14px] lg:gap-5 lg:rounded-[12px] lg:p-[10px] lg:pb-4">
              <span aria-hidden className="vv-shine vv-shine-lyr-a pointer-events-none absolute inset-0 rounded-[inherit] pointer-coarse:hidden" style={{ padding: 1, animationDuration: "2.8s", backgroundImage: "conic-gradient(from calc(var(--vv-shine-a) - var(--vv-shine-w, 24deg)), transparent 0deg, #0099FF calc(var(--vv-shine-w, 24deg) / 2), #7ACAFF var(--vv-shine-w, 24deg), transparent calc(var(--vv-shine-w, 24deg) * 2), transparent 360deg)", mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", maskComposite: "exclude", WebkitMaskComposite: "xor" }} />
              <span aria-hidden className="vv-shine vv-shine-lyr-b pointer-events-none absolute inset-0 rounded-[inherit] pointer-coarse:hidden" style={{ padding: 1, animationDuration: "2.8s", backgroundImage: "conic-gradient(from calc(var(--vv-shine-b) - var(--vv-shine-w, 24deg)), transparent 0deg, #0099FF calc(var(--vv-shine-w, 24deg) / 2), #7ACAFF var(--vv-shine-w, 24deg), transparent calc(var(--vv-shine-w, 24deg) * 2), transparent 360deg)", mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", maskComposite: "exclude", WebkitMaskComposite: "xor" }} />
              <div className="relative overflow-hidden rounded-[3px] lg:rounded-[6px]">
                <div aria-hidden className="relative aspect-[16/10] overflow-hidden" style={{ background: "linear-gradient(168deg, #0B6BBE 0%, #084F92 46%, #052E58 100%)" }}>
                  <span className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(90% 80% at 18% 0%, rgba(255,255,255,0.16) 0%, transparent 55%)" }} />
                  <span className="pointer-events-none absolute inset-0" style={{ backgroundImage: "radial-gradient(rgba(255,255,255,0.17) 1px, transparent 1px)", backgroundSize: "13px 13px", maskImage: "radial-gradient(130% 110% at 50% 0%, #000 26%, transparent 76%)", WebkitMaskImage: "radial-gradient(130% 110% at 50% 0%, #000 26%, transparent 76%)" }} />
                  <div className="rounded-[9px] bg-white shadow-[0_14px_34px_-14px_rgba(0,20,40,0.6)] vv-anim-float absolute bottom-[8%] left-[5%] z-10 px-2.5 py-1.5 text-[9px] leading-none font-medium" style={{ color: "#0A2A44" }}>
                    {$t("custom")}
                  </div>
                  <div className="absolute top-[16%] right-0 bottom-0 left-[24%] overflow-hidden rounded-tl-[5px] bg-[#0A0D12] shadow-[0_14px_34px_-14px_rgba(0,10,22,0.8)]">
                    <span className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-3 py-2">
                      <span className="flex items-center gap-1.5">
                        <span className="block size-[8px] rounded-[2.5px]" style={{ background: "#0099FF" }} />
                        <span className="text-[8px] leading-none font-medium text-white">
                          {$t("studio")}
                        </span>
                      </span>
                      <span className="flex items-center gap-2 text-[7px] leading-none text-white/70">
                        <span>
                          {$t("work")}
                        </span>
                        <span>
                          {$t("about")}
                        </span>
                        <span className="rounded-full bg-white px-2 py-[4px] font-medium" style={{ color: "#0A2A44" }}>
                          {$t("contact")}
                        </span>
                      </span>
                    </span>
                    <span className="vv-anim-scroll block">
                      <span className="relative block">
                        <img src="/services/arch.jpg" alt="" className="block h-[104px] w-full object-cover" loading="lazy" decoding="async" />
                        <span className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(6,9,14,0.62) 0%, rgba(6,9,14,0.08) 38%, rgba(6,9,14,0.94) 100%)" }} />
                        <span className="absolute inset-x-0 bottom-0 px-3 pb-2">
                          <span className="block font-display text-[14px] leading-[1.1] font-medium text-white">
                            {$t("crafted-not-assembled")}
                          </span>
                          <span className="mt-1.5 flex items-center gap-2">
                            <span className="inline-block rounded-full px-2.5 py-[5px] text-[8px] leading-none font-medium text-white" style={{ background: "#0099FF" }}>
                              {$t("start-a-project")}
                            </span>
                            <span className="text-[7px] leading-none text-white/60">
                              {$t("design-build-launch")}
                            </span>
                          </span>
                        </span>
                      </span>
                      <span className="block px-3">
                        <span className="mt-2 flex items-center justify-between border-t border-white/10 pt-2 text-[7px] leading-none text-white/50">
                          <span>
                            <span className="font-display text-[10px] font-medium text-white">
                              48
                            </span>
                            {$t("sites")}
                          </span>
                          <span>
                            <span className="font-display text-[10px] font-medium text-white">
                              12
                            </span>
                            {" "}
                            {$t("industries")}
                          </span>
                          <span>
                            <span className="font-display text-[10px] font-medium text-white">
                              5.0
                            </span>
                            {" ★"}
                          </span>
                        </span>
                        <span className="mt-2.5 flex gap-2">
                          <span className="min-w-0 flex-1">
                            <span className="block text-[8px] leading-none font-medium text-white">
                              {$t("built-around-you")}
                            </span>
                            <span className="mt-1.5 block h-[5px] w-[92%] rounded-full bg-white/12" />
                            <span className="mt-1 block h-[5px] w-[70%] rounded-full bg-white/12" />
                            <span className="mt-1 block h-[5px] w-[82%] rounded-full bg-white/12" />
                          </span>
                          <img src="/services/brand.jpg" alt="" className="block h-[36px] w-[36%] shrink-0 rounded-[5px] object-cover" loading="lazy" decoding="async" />
                        </span>
                        <span className="mt-2.5 block text-[8px] leading-none font-medium text-white">
                          {$t("selected-work")}
                        </span>
                        <span className="mt-1.5 flex gap-1.5">
                          <img src="/services/vivid.jpg" alt="" className="block h-[32px] min-w-0 flex-1 rounded-[5px] object-cover" loading="lazy" decoding="async" />
                          <img src="/services/office.jpg" alt="" className="block h-[32px] min-w-0 flex-1 rounded-[5px] object-cover" loading="lazy" decoding="async" />
                        </span>
                        <span className="mt-2.5 flex justify-between border-t border-white/10 pt-1.5 pb-2 text-[6.5px] leading-none text-white/40">
                          <span>
                            {$t("studio-2")}
                          </span>
                          <span>
                            {$t("built-by-hand")}
                          </span>
                        </span>
                      </span>
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex flex-1 items-end justify-between gap-4 pl-2">
                <div className="flex min-w-0 flex-col gap-1.5">
                  <h2 className="font-display text-[16px] leading-[1.25] font-medium tracking-h3 lg:text-[21px]">
                    {$t("crafted-websites")}
                  </h2>
                  <p className="line-clamp-2 text-[13px] leading-[1.5] text-fg-muted lg:text-[14px]">
                    {$t("custom-built-websites-designed-from-the")}
                  </p>
                </div>
                <span className="hidden shrink-0 rounded-[10px] bg-fg/10 px-4 py-2.5 text-[14px] leading-none font-medium text-fg transition-colors group-hover:bg-fg/20 group-hover:text-fg-strong lg:inline-flex">
                  {$t("explore")}
                </span>
              </div>
            </Link>
            <Link data-reveal href="/services/website-redesign" className="group relative flex flex-col gap-3 rounded-[6px] border border-fg/12 bg-bg/30 p-[6px] pb-3 backdrop-blur-[14px] lg:gap-5 lg:rounded-[12px] lg:p-[10px] lg:pb-4">
              <span aria-hidden className="vv-shine vv-shine-lyr-a pointer-events-none absolute inset-0 rounded-[inherit] pointer-coarse:hidden" style={{ padding: 1, animationDuration: "2.8s", backgroundImage: "conic-gradient(from calc(var(--vv-shine-a) - var(--vv-shine-w, 24deg)), transparent 0deg, #0099FF calc(var(--vv-shine-w, 24deg) / 2), #7ACAFF var(--vv-shine-w, 24deg), transparent calc(var(--vv-shine-w, 24deg) * 2), transparent 360deg)", mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", maskComposite: "exclude", WebkitMaskComposite: "xor" }} />
              <span aria-hidden className="vv-shine vv-shine-lyr-b pointer-events-none absolute inset-0 rounded-[inherit] pointer-coarse:hidden" style={{ padding: 1, animationDuration: "2.8s", backgroundImage: "conic-gradient(from calc(var(--vv-shine-b) - var(--vv-shine-w, 24deg)), transparent 0deg, #0099FF calc(var(--vv-shine-w, 24deg) / 2), #7ACAFF var(--vv-shine-w, 24deg), transparent calc(var(--vv-shine-w, 24deg) * 2), transparent 360deg)", mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", maskComposite: "exclude", WebkitMaskComposite: "xor" }} />
              <div className="relative overflow-hidden rounded-[3px] lg:rounded-[6px]">
                <div aria-hidden className="relative aspect-[16/10] overflow-hidden" style={{ background: "linear-gradient(168deg, #0B6BBE 0%, #084F92 46%, #052E58 100%)" }}>
                  <span className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(90% 80% at 18% 0%, rgba(255,255,255,0.16) 0%, transparent 55%)" }} />
                  <span className="pointer-events-none absolute inset-0" style={{ backgroundImage: "radial-gradient(rgba(255,255,255,0.17) 1px, transparent 1px)", backgroundSize: "13px 13px", maskImage: "radial-gradient(130% 110% at 50% 0%, #000 26%, transparent 76%)", WebkitMaskImage: "radial-gradient(130% 110% at 50% 0%, #000 26%, transparent 76%)" }} />
                  <div className="absolute top-[13%] bottom-0 left-[6%] w-[56%] overflow-hidden rounded-t-[4px] bg-[#DDE1E5]">
                    <span className="flex items-center justify-between bg-[#9AA4AD] px-2.5 py-1.5">
                      <span className="text-[7px] leading-none font-bold tracking-wide text-white/90 uppercase">
                        {$t("old-homepage")}
                      </span>
                      <span className="flex gap-1">
                        <span className="block h-[4px] w-[14px] rounded-[1px] bg-white/50" />
                        <span className="block h-[4px] w-[14px] rounded-[1px] bg-white/50" />
                        <span className="block h-[4px] w-[14px] rounded-[1px] bg-white/50" />
                      </span>
                    </span>
                    <span className="flex border-b" style={{ borderColor: "#C2C9CF" }}>
                      <span className="flex-1 border-r bg-[#CBD1D6] px-1 py-[4px] text-center text-[6px] leading-none font-bold" style={{ borderColor: "#B4BBC1", color: "#4A555E" }}>
                        {$t("home")}
                      </span>
                      <span className="flex-1 border-r bg-[#CBD1D6] px-1 py-[4px] text-center text-[6px] leading-none font-bold" style={{ borderColor: "#B4BBC1", color: "#4A555E" }}>
                        {$t("about-2")}
                      </span>
                      <span className="flex-1 border-r bg-[#CBD1D6] px-1 py-[4px] text-center text-[6px] leading-none font-bold" style={{ borderColor: "#B4BBC1", color: "#4A555E" }}>
                        {$t("gallery")}
                      </span>
                      <span className="flex-1 border-r bg-[#CBD1D6] px-1 py-[4px] text-center text-[6px] leading-none font-bold" style={{ borderColor: "#B4BBC1", color: "#4A555E" }}>
                        {$t("links")}
                      </span>
                    </span>
                    <span className="block px-2.5 pt-1.5">
                      <span className="block text-[8px] leading-[1.2] font-bold" style={{ color: "#4A555E" }}>
                        {$t("welcome-to-our-website")}
                      </span>
                      <span className="mt-1 block text-[6px] leading-[1.3]" style={{ color: "#6B767F" }}>
                        {$t("best-viewed-at-1024-768")}
                      </span>
                      <span className="mt-1.5 flex gap-1.5">
                        <img src="/services/office.jpg" alt="" className="block h-[34px] w-[44%] rounded-[2px] object-cover [filter:grayscale(1)_contrast(0.85)]" loading="lazy" decoding="async" />
                        <span className="min-w-0 flex-1">
                          <span className="block h-[5px] w-full rounded-full bg-[#AEB7BF]" />
                          <span className="mt-1 block h-[5px] w-[88%] rounded-full bg-[#AEB7BF]" />
                          <span className="mt-1 block h-[5px] w-[94%] rounded-full bg-[#AEB7BF]" />
                          <span className="mt-1 block h-[5px] w-[62%] rounded-full bg-[#AEB7BF]" />
                        </span>
                      </span>
                      <span className="mt-1.5 flex items-center gap-1.5">
                        <span className="inline-block border px-2 py-[4px] text-[7px] leading-none font-bold" style={{ borderColor: "#8E979F", color: "#4A555E" }}>
                          {$t("click-here")}
                        </span>
                        <span className="inline-block border px-2 py-[4px] text-[7px] leading-none font-bold" style={{ borderColor: "#8E979F", color: "#4A555E" }}>
                          {$t("read-more")}
                        </span>
                      </span>
                      <span className="mt-1.5 block text-[6.5px] leading-[1.35] font-bold" style={{ color: "#4A555E" }}>
                        {$t("news")}
                      </span>
                      <span className="block h-[4px] w-[92%] rounded-full bg-[#B9C1C8]" />
                      <span className="mt-[3px] block h-[4px] w-[78%] rounded-full bg-[#B9C1C8]" />
                      <span className="mt-[3px] block h-[4px] w-[86%] rounded-full bg-[#B9C1C8]" />
                      <span className="mt-1.5 flex justify-between border-t pt-1 pb-1.5 text-[6px] leading-none" style={{ borderColor: "#C2C9CF", color: "#6B767F" }}>
                        <span>
                          {$t("visitors-003847")}
                        </span>
                        <span>
                          {$t("last-updated-2011")}
                        </span>
                      </span>
                    </span>
                  </div>
                  <div className="absolute top-[26%] right-0 bottom-0 left-[30%] overflow-hidden rounded-tl-[5px] bg-[#0A0D12] shadow-[0_14px_34px_-14px_rgba(0,10,22,0.85)]">
                    <span className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-3 py-2">
                      <span className="flex items-center gap-1.5">
                        <span className="block size-[8px] rounded-[2.5px]" style={{ background: "#0099FF" }} />
                        <span className="text-[8px] leading-none font-medium text-white">
                          {$t("studio")}
                        </span>
                      </span>
                      <span className="rounded-full bg-white px-2 py-[4px] text-[7px] leading-none font-medium" style={{ color: "#0A2A44" }}>
                        {$t("contact")}
                      </span>
                    </span>
                    <span className="relative block h-full">
                      <img src="/services/vivid.jpg" alt="" className="absolute inset-0 size-full object-cover" loading="lazy" decoding="async" />
                      <span className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(6,9,14,0.66) 0%, rgba(6,9,14,0.12) 42%, rgba(6,9,14,0.9) 100%)" }} />
                      <span className="absolute inset-x-0 bottom-0 px-3 pb-2.5">
                        <span className="block font-display text-[13px] leading-[1.1] font-medium text-white">
                          {$t("same-brand-new-energy")}
                        </span>
                        <span className="mt-1.5 flex items-center gap-1.5">
                          <span className="inline-block rounded-full px-2.5 py-[5px] text-[8px] leading-none font-medium text-white" style={{ background: "#0099FF" }}>
                            {$t("explore")}
                          </span>
                          <span className="inline-block rounded-full border border-white/25 px-2.5 py-[5px] text-[8px] leading-none font-medium text-white/85">
                            {$t("2-faster")}
                          </span>
                        </span>
                      </span>
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex flex-1 items-end justify-between gap-4 pl-2">
                <div className="flex min-w-0 flex-col gap-1.5">
                  <h2 className="font-display text-[16px] leading-[1.25] font-medium tracking-h3 lg:text-[21px]">
                    {$t("website-redesign")}
                  </h2>
                  <p className="line-clamp-2 text-[13px] leading-[1.5] text-fg-muted lg:text-[14px]">
                    {$t("transform-your-existing-website-into-a")}
                  </p>
                </div>
                <span className="hidden shrink-0 rounded-[10px] bg-fg/10 px-4 py-2.5 text-[14px] leading-none font-medium text-fg transition-colors group-hover:bg-fg/20 group-hover:text-fg-strong lg:inline-flex">
                  {$t("explore")}
                </span>
              </div>
            </Link>
            <Link data-reveal href="/services/ecommerce-website-design" className="group relative flex flex-col gap-3 rounded-[6px] border border-fg/12 bg-bg/30 p-[6px] pb-3 backdrop-blur-[14px] lg:gap-5 lg:rounded-[12px] lg:p-[10px] lg:pb-4">
              <span aria-hidden className="vv-shine vv-shine-lyr-a pointer-events-none absolute inset-0 rounded-[inherit] pointer-coarse:hidden" style={{ padding: 1, animationDuration: "2.8s", backgroundImage: "conic-gradient(from calc(var(--vv-shine-a) - var(--vv-shine-w, 24deg)), transparent 0deg, #0099FF calc(var(--vv-shine-w, 24deg) / 2), #7ACAFF var(--vv-shine-w, 24deg), transparent calc(var(--vv-shine-w, 24deg) * 2), transparent 360deg)", mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", maskComposite: "exclude", WebkitMaskComposite: "xor" }} />
              <span aria-hidden className="vv-shine vv-shine-lyr-b pointer-events-none absolute inset-0 rounded-[inherit] pointer-coarse:hidden" style={{ padding: 1, animationDuration: "2.8s", backgroundImage: "conic-gradient(from calc(var(--vv-shine-b) - var(--vv-shine-w, 24deg)), transparent 0deg, #0099FF calc(var(--vv-shine-w, 24deg) / 2), #7ACAFF var(--vv-shine-w, 24deg), transparent calc(var(--vv-shine-w, 24deg) * 2), transparent 360deg)", mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", maskComposite: "exclude", WebkitMaskComposite: "xor" }} />
              <div className="relative overflow-hidden rounded-[3px] lg:rounded-[6px]">
                <div aria-hidden className="relative aspect-[16/10] overflow-hidden" style={{ background: "linear-gradient(168deg, #0B6BBE 0%, #084F92 46%, #052E58 100%)" }}>
                  <span className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(90% 80% at 18% 0%, rgba(255,255,255,0.16) 0%, transparent 55%)" }} />
                  <span className="pointer-events-none absolute inset-0" style={{ backgroundImage: "radial-gradient(rgba(255,255,255,0.17) 1px, transparent 1px)", backgroundSize: "13px 13px", maskImage: "radial-gradient(130% 110% at 50% 0%, #000 26%, transparent 76%)", WebkitMaskImage: "radial-gradient(130% 110% at 50% 0%, #000 26%, transparent 76%)" }} />
                  <svg viewBox="0 0 100 62.5" preserveAspectRatio="none" className="absolute inset-0 size-full" fill="none">
                    <g>
                      <path d="M 16 11.25 Q 33 13 50 31.25" stroke="rgba(255,255,255,0.16)" strokeWidth="0.6" />
                      <path d="M 16 11.25 Q 33 13 50 31.25" stroke="#9CD2FF" strokeOpacity={0.12} strokeWidth="0.9" strokeLinecap="round" pathLength={100} strokeDasharray="16 84" strokeDashoffset="$-0" className="vv-anim-beam" style={{ animationDelay: "0s", "--vv-beam-o": "0px" }} />
                      <path d="M 16 11.25 Q 33 13 50 31.25" stroke="#9CD2FF" strokeOpacity={0.18} strokeWidth="0.9" strokeLinecap="round" pathLength={100} strokeDasharray="13 87" strokeDashoffset={-1.5} className="vv-anim-beam" style={{ animationDelay: "0s", "--vv-beam-o": "-1.5px" }} />
                      <path d="M 16 11.25 Q 33 13 50 31.25" stroke="#9CD2FF" strokeOpacity={0.26} strokeWidth="0.9" strokeLinecap="round" pathLength={100} strokeDasharray="10 90" strokeDashoffset={-3} className="vv-anim-beam" style={{ animationDelay: "0s", "--vv-beam-o": "-3px" }} />
                      <path d="M 16 11.25 Q 33 13 50 31.25" stroke="#9CD2FF" strokeOpacity={0.34} strokeWidth="0.9" strokeLinecap="round" pathLength={100} strokeDasharray="7 93" strokeDashoffset={-4.5} className="vv-anim-beam" style={{ animationDelay: "0s", "--vv-beam-o": "-4.5px" }} />
                      <path d="M 16 11.25 Q 33 13 50 31.25" stroke="#9CD2FF" strokeOpacity={0.45} strokeWidth="0.9" strokeLinecap="round" pathLength={100} strokeDasharray="4 96" strokeDashoffset={-6} className="vv-anim-beam" style={{ animationDelay: "0s", "--vv-beam-o": "-6px" }} />
                    </g>
                    <g>
                      <path d="M 9 31.25 L 50 31.25" stroke="rgba(255,255,255,0.16)" strokeWidth="0.6" />
                      <path d="M 9 31.25 L 50 31.25" stroke="#9CD2FF" strokeOpacity={0.12} strokeWidth="0.9" strokeLinecap="round" pathLength={100} strokeDasharray="16 84" strokeDashoffset="$-0" className="vv-anim-beam" style={{ animationDelay: "0.6s", "--vv-beam-o": "0px" }} />
                      <path d="M 9 31.25 L 50 31.25" stroke="#9CD2FF" strokeOpacity={0.18} strokeWidth="0.9" strokeLinecap="round" pathLength={100} strokeDasharray="13 87" strokeDashoffset={-1.5} className="vv-anim-beam" style={{ animationDelay: "0.6s", "--vv-beam-o": "-1.5px" }} />
                      <path d="M 9 31.25 L 50 31.25" stroke="#9CD2FF" strokeOpacity={0.26} strokeWidth="0.9" strokeLinecap="round" pathLength={100} strokeDasharray="10 90" strokeDashoffset={-3} className="vv-anim-beam" style={{ animationDelay: "0.6s", "--vv-beam-o": "-3px" }} />
                      <path d="M 9 31.25 L 50 31.25" stroke="#9CD2FF" strokeOpacity={0.34} strokeWidth="0.9" strokeLinecap="round" pathLength={100} strokeDasharray="7 93" strokeDashoffset={-4.5} className="vv-anim-beam" style={{ animationDelay: "0.6s", "--vv-beam-o": "-4.5px" }} />
                      <path d="M 9 31.25 L 50 31.25" stroke="#9CD2FF" strokeOpacity={0.45} strokeWidth="0.9" strokeLinecap="round" pathLength={100} strokeDasharray="4 96" strokeDashoffset={-6} className="vv-anim-beam" style={{ animationDelay: "0.6s", "--vv-beam-o": "-6px" }} />
                    </g>
                    <g>
                      <path d="M 16 51.25 Q 33 49.5 50 31.25" stroke="rgba(255,255,255,0.16)" strokeWidth="0.6" />
                      <path d="M 16 51.25 Q 33 49.5 50 31.25" stroke="#9CD2FF" strokeOpacity={0.12} strokeWidth="0.9" strokeLinecap="round" pathLength={100} strokeDasharray="16 84" strokeDashoffset="$-0" className="vv-anim-beam" style={{ animationDelay: "1.2s", "--vv-beam-o": "0px" }} />
                      <path d="M 16 51.25 Q 33 49.5 50 31.25" stroke="#9CD2FF" strokeOpacity={0.18} strokeWidth="0.9" strokeLinecap="round" pathLength={100} strokeDasharray="13 87" strokeDashoffset={-1.5} className="vv-anim-beam" style={{ animationDelay: "1.2s", "--vv-beam-o": "-1.5px" }} />
                      <path d="M 16 51.25 Q 33 49.5 50 31.25" stroke="#9CD2FF" strokeOpacity={0.26} strokeWidth="0.9" strokeLinecap="round" pathLength={100} strokeDasharray="10 90" strokeDashoffset={-3} className="vv-anim-beam" style={{ animationDelay: "1.2s", "--vv-beam-o": "-3px" }} />
                      <path d="M 16 51.25 Q 33 49.5 50 31.25" stroke="#9CD2FF" strokeOpacity={0.34} strokeWidth="0.9" strokeLinecap="round" pathLength={100} strokeDasharray="7 93" strokeDashoffset={-4.5} className="vv-anim-beam" style={{ animationDelay: "1.2s", "--vv-beam-o": "-4.5px" }} />
                      <path d="M 16 51.25 Q 33 49.5 50 31.25" stroke="#9CD2FF" strokeOpacity={0.45} strokeWidth="0.9" strokeLinecap="round" pathLength={100} strokeDasharray="4 96" strokeDashoffset={-6} className="vv-anim-beam" style={{ animationDelay: "1.2s", "--vv-beam-o": "-6px" }} />
                    </g>
                    <g>
                      <path d="M 50 31.25 Q 67 13 84 11.25" stroke="rgba(255,255,255,0.16)" strokeWidth="0.6" />
                      <path d="M 50 31.25 Q 67 13 84 11.25" stroke="#9CD2FF" strokeOpacity={0.12} strokeWidth="0.9" strokeLinecap="round" pathLength={100} strokeDasharray="16 84" strokeDashoffset="$-0" className="vv-anim-beam" style={{ animationDelay: "0.3s", "--vv-beam-o": "0px" }} />
                      <path d="M 50 31.25 Q 67 13 84 11.25" stroke="#9CD2FF" strokeOpacity={0.18} strokeWidth="0.9" strokeLinecap="round" pathLength={100} strokeDasharray="13 87" strokeDashoffset={-1.5} className="vv-anim-beam" style={{ animationDelay: "0.3s", "--vv-beam-o": "-1.5px" }} />
                      <path d="M 50 31.25 Q 67 13 84 11.25" stroke="#9CD2FF" strokeOpacity={0.26} strokeWidth="0.9" strokeLinecap="round" pathLength={100} strokeDasharray="10 90" strokeDashoffset={-3} className="vv-anim-beam" style={{ animationDelay: "0.3s", "--vv-beam-o": "-3px" }} />
                      <path d="M 50 31.25 Q 67 13 84 11.25" stroke="#9CD2FF" strokeOpacity={0.34} strokeWidth="0.9" strokeLinecap="round" pathLength={100} strokeDasharray="7 93" strokeDashoffset={-4.5} className="vv-anim-beam" style={{ animationDelay: "0.3s", "--vv-beam-o": "-4.5px" }} />
                      <path d="M 50 31.25 Q 67 13 84 11.25" stroke="#9CD2FF" strokeOpacity={0.45} strokeWidth="0.9" strokeLinecap="round" pathLength={100} strokeDasharray="4 96" strokeDashoffset={-6} className="vv-anim-beam" style={{ animationDelay: "0.3s", "--vv-beam-o": "-6px" }} />
                    </g>
                    <g>
                      <path d="M 50 31.25 L 91 31.25" stroke="rgba(255,255,255,0.16)" strokeWidth="0.6" />
                      <path d="M 50 31.25 L 91 31.25" stroke="#9CD2FF" strokeOpacity={0.12} strokeWidth="0.9" strokeLinecap="round" pathLength={100} strokeDasharray="16 84" strokeDashoffset="$-0" className="vv-anim-beam" style={{ animationDelay: "0.9s", "--vv-beam-o": "0px" }} />
                      <path d="M 50 31.25 L 91 31.25" stroke="#9CD2FF" strokeOpacity={0.18} strokeWidth="0.9" strokeLinecap="round" pathLength={100} strokeDasharray="13 87" strokeDashoffset={-1.5} className="vv-anim-beam" style={{ animationDelay: "0.9s", "--vv-beam-o": "-1.5px" }} />
                      <path d="M 50 31.25 L 91 31.25" stroke="#9CD2FF" strokeOpacity={0.26} strokeWidth="0.9" strokeLinecap="round" pathLength={100} strokeDasharray="10 90" strokeDashoffset={-3} className="vv-anim-beam" style={{ animationDelay: "0.9s", "--vv-beam-o": "-3px" }} />
                      <path d="M 50 31.25 L 91 31.25" stroke="#9CD2FF" strokeOpacity={0.34} strokeWidth="0.9" strokeLinecap="round" pathLength={100} strokeDasharray="7 93" strokeDashoffset={-4.5} className="vv-anim-beam" style={{ animationDelay: "0.9s", "--vv-beam-o": "-4.5px" }} />
                      <path d="M 50 31.25 L 91 31.25" stroke="#9CD2FF" strokeOpacity={0.45} strokeWidth="0.9" strokeLinecap="round" pathLength={100} strokeDasharray="4 96" strokeDashoffset={-6} className="vv-anim-beam" style={{ animationDelay: "0.9s", "--vv-beam-o": "-6px" }} />
                    </g>
                    <g>
                      <path d="M 50 31.25 Q 67 49.5 84 51.25" stroke="rgba(255,255,255,0.16)" strokeWidth="0.6" />
                      <path d="M 50 31.25 Q 67 49.5 84 51.25" stroke="#9CD2FF" strokeOpacity={0.12} strokeWidth="0.9" strokeLinecap="round" pathLength={100} strokeDasharray="16 84" strokeDashoffset="$-0" className="vv-anim-beam" style={{ animationDelay: "1.5s", "--vv-beam-o": "0px" }} />
                      <path d="M 50 31.25 Q 67 49.5 84 51.25" stroke="#9CD2FF" strokeOpacity={0.18} strokeWidth="0.9" strokeLinecap="round" pathLength={100} strokeDasharray="13 87" strokeDashoffset={-1.5} className="vv-anim-beam" style={{ animationDelay: "1.5s", "--vv-beam-o": "-1.5px" }} />
                      <path d="M 50 31.25 Q 67 49.5 84 51.25" stroke="#9CD2FF" strokeOpacity={0.26} strokeWidth="0.9" strokeLinecap="round" pathLength={100} strokeDasharray="10 90" strokeDashoffset={-3} className="vv-anim-beam" style={{ animationDelay: "1.5s", "--vv-beam-o": "-3px" }} />
                      <path d="M 50 31.25 Q 67 49.5 84 51.25" stroke="#9CD2FF" strokeOpacity={0.34} strokeWidth="0.9" strokeLinecap="round" pathLength={100} strokeDasharray="7 93" strokeDashoffset={-4.5} className="vv-anim-beam" style={{ animationDelay: "1.5s", "--vv-beam-o": "-4.5px" }} />
                      <path d="M 50 31.25 Q 67 49.5 84 51.25" stroke="#9CD2FF" strokeOpacity={0.45} strokeWidth="0.9" strokeLinecap="round" pathLength={100} strokeDasharray="4 96" strokeDashoffset={-6} className="vv-anim-beam" style={{ animationDelay: "1.5s", "--vv-beam-o": "-6px" }} />
                    </g>
                  </svg>
                  <span className="rounded-[9px] bg-white shadow-[0_14px_34px_-14px_rgba(0,20,40,0.6)] absolute grid size-[32px] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full" style={{ left: "16%", top: "18%" }}>
                    <svg viewBox="0 0 24 24" className="size-[15px]" fill="none" stroke="#0A2A44" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2.5" y="5" width="19" height="14" rx="2.5" />
                      <path d="M2.5 10h19" />
                    </svg>
                  </span>
                  <span className="rounded-[9px] bg-white shadow-[0_14px_34px_-14px_rgba(0,20,40,0.6)] absolute grid size-[32px] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full" style={{ left: "9%", top: "50%" }}>
                    <svg viewBox="0 0 24 24" className="size-[15px]" fill="none" stroke="#0A2A44" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 8v8l-9 5-9-5V8l9-5 9 5z" />
                      <path d="M3 8l9 5 9-5" />
                      <path d="M12 13v8" />
                    </svg>
                  </span>
                  <span className="rounded-[9px] bg-white shadow-[0_14px_34px_-14px_rgba(0,20,40,0.6)] absolute grid size-[32px] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full" style={{ left: "16%", top: "82%" }}>
                    <svg viewBox="0 0 24 24" className="size-[15px]" fill="none" stroke="#0A2A44" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1.5 6h12v10h-12z" />
                      <path d="M13.5 10h4l3.5 3.5V16h-7.5" />
                      <circle cx="5.5" cy="18.5" r="1.6" />
                      <circle cx="17" cy="18.5" r="1.6" />
                    </svg>
                  </span>
                  <span className="rounded-[9px] bg-white shadow-[0_14px_34px_-14px_rgba(0,20,40,0.6)] absolute grid size-[32px] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full" style={{ left: "84%", top: "18%" }}>
                    <svg viewBox="0 0 24 24" className="size-[15px]" fill="none" stroke="#0A2A44" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 3l7 3v5c0 4.5-3 8-7 9.5C8 19 5 15.5 5 11V6z" />
                      <path d="M9 11.5l2 2 3.5-3.5" />
                    </svg>
                  </span>
                  <span className="rounded-[9px] bg-white shadow-[0_14px_34px_-14px_rgba(0,20,40,0.6)] absolute grid size-[32px] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full" style={{ left: "91%", top: "50%" }}>
                    <svg viewBox="0 0 24 24" className="size-[15px]" fill="none" stroke="#0A2A44" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20.5 12.5l-8 8-9-9V4h7.5z" />
                      <circle cx="7.5" cy="7.5" r="1.3" fill="#0A2A44" stroke="none" />
                    </svg>
                  </span>
                  <span className="rounded-[9px] bg-white shadow-[0_14px_34px_-14px_rgba(0,20,40,0.6)] absolute grid size-[32px] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full" style={{ left: "84%", top: "82%" }}>
                    <svg viewBox="0 0 24 24" className="size-[15px]" fill="none" stroke="#0A2A44" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2.5v19" />
                      <path d="M16.5 6.5c-1-1.3-2.6-2-4.5-2-2.5 0-4.5 1.3-4.5 3.4 0 4.4 9 2.4 9 6.9 0 2.1-2 3.4-4.5 3.4-1.9 0-3.6-.8-4.6-2.1" />
                    </svg>
                  </span>
                  <span className="rounded-[9px] bg-white shadow-[0_14px_34px_-14px_rgba(0,20,40,0.6)] absolute top-[50%] left-[50%] grid size-[46px] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full">
                    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="#0A2A44" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="9" cy="20" r="1.4" />
                      <circle cx="17" cy="20" r="1.4" />
                      <path d="M3 4h2.4l2.2 11.2a1.6 1.6 0 0 0 1.6 1.3h7.9a1.6 1.6 0 0 0 1.6-1.3L20.4 8H6" />
                    </svg>
                    <span className="vv-anim-pop absolute -top-0.5 -right-0.5 grid size-[15px] place-items-center rounded-full text-[8px] leading-none font-medium text-white" style={{ background: "#0099FF" }}>
                      3
                    </span>
                  </span>
                </div>
              </div>
              <div className="flex flex-1 items-end justify-between gap-4 pl-2">
                <div className="flex min-w-0 flex-col gap-1.5">
                  <h2 className="font-display text-[16px] leading-[1.25] font-medium tracking-h3 lg:text-[21px]">
                    {$t("ecommerce-website-design")}
                  </h2>
                  <p className="line-clamp-2 text-[13px] leading-[1.5] text-fg-muted lg:text-[14px]">
                    {$t("ecommerce-experiences-built-for-ease-and")}
                  </p>
                </div>
                <span className="hidden shrink-0 rounded-[10px] bg-fg/10 px-4 py-2.5 text-[14px] leading-none font-medium text-fg transition-colors group-hover:bg-fg/20 group-hover:text-fg-strong lg:inline-flex">
                  {$t("explore")}
                </span>
              </div>
            </Link>
            <Link data-reveal href="/services/cms-and-dynamic-websites" className="group relative flex flex-col gap-3 rounded-[6px] border border-fg/12 bg-bg/30 p-[6px] pb-3 backdrop-blur-[14px] lg:gap-5 lg:rounded-[12px] lg:p-[10px] lg:pb-4">
              <span aria-hidden className="vv-shine vv-shine-lyr-a pointer-events-none absolute inset-0 rounded-[inherit] pointer-coarse:hidden" style={{ padding: 1, animationDuration: "2.8s", backgroundImage: "conic-gradient(from calc(var(--vv-shine-a) - var(--vv-shine-w, 24deg)), transparent 0deg, #0099FF calc(var(--vv-shine-w, 24deg) / 2), #7ACAFF var(--vv-shine-w, 24deg), transparent calc(var(--vv-shine-w, 24deg) * 2), transparent 360deg)", mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", maskComposite: "exclude", WebkitMaskComposite: "xor" }} />
              <span aria-hidden className="vv-shine vv-shine-lyr-b pointer-events-none absolute inset-0 rounded-[inherit] pointer-coarse:hidden" style={{ padding: 1, animationDuration: "2.8s", backgroundImage: "conic-gradient(from calc(var(--vv-shine-b) - var(--vv-shine-w, 24deg)), transparent 0deg, #0099FF calc(var(--vv-shine-w, 24deg) / 2), #7ACAFF var(--vv-shine-w, 24deg), transparent calc(var(--vv-shine-w, 24deg) * 2), transparent 360deg)", mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", maskComposite: "exclude", WebkitMaskComposite: "xor" }} />
              <div className="relative overflow-hidden rounded-[3px] lg:rounded-[6px]">
                <div aria-hidden className="relative aspect-[16/10] overflow-hidden" style={{ background: "linear-gradient(168deg, #0B6BBE 0%, #084F92 46%, #052E58 100%)" }}>
                  <span className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(90% 80% at 18% 0%, rgba(255,255,255,0.16) 0%, transparent 55%)" }} />
                  <span className="pointer-events-none absolute inset-0" style={{ backgroundImage: "radial-gradient(rgba(255,255,255,0.17) 1px, transparent 1px)", backgroundSize: "13px 13px", maskImage: "radial-gradient(130% 110% at 50% 0%, #000 26%, transparent 76%)", WebkitMaskImage: "radial-gradient(130% 110% at 50% 0%, #000 26%, transparent 76%)" }} />
                  <div className="absolute top-[17%] right-0 bottom-0 left-[7%] flex flex-col overflow-hidden rounded-tl-[5px] bg-[#0A0D12] shadow-[0_14px_34px_-14px_rgba(0,10,22,0.8)]">
                    <span className="flex items-center px-3 pt-2.5 pb-2 text-[7.5px] leading-none text-white/45">
                      <span className="min-w-0 flex-1">
                        {$t("title")}
                      </span>
                      <span className="w-[27%] shrink-0">
                        {$t("date")}
                      </span>
                      <span className="w-[15%] shrink-0">
                        {$t("image")}
                      </span>
                    </span>
                    <span className="flex flex-1 items-center border-t border-white/8 px-3 py-[6px]">
                      <span className="flex min-w-0 flex-1 items-center gap-1.5 pr-2">
                        <svg viewBox="0 0 24 24" className="size-[9px] shrink-0" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="2" strokeLinejoin="round">
                          <path d="M14 3H7a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V7z" />
                          <path d="M14 3v4h4" />
                        </svg>
                        <span className="truncate text-[8px] leading-none text-white/90">
                          {$t("designing-responsive-websites-best-practices")}
                        </span>
                      </span>
                      <span className="w-[27%] shrink-0 text-[7.5px] leading-none text-white/50">
                        {$t("28-june-2024")}
                      </span>
                      <span className="w-[15%] shrink-0">
                        <img src="/services/vivid.jpg" alt="" className="block h-[13px] w-[24px] rounded-[4px] object-cover" loading="lazy" decoding="async" />
                      </span>
                    </span>
                    <span className="flex flex-1 items-center border-t border-white/8 px-3 py-[6px]">
                      <span className="flex min-w-0 flex-1 items-center gap-1.5 pr-2">
                        <svg viewBox="0 0 24 24" className="size-[9px] shrink-0" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="2" strokeLinejoin="round">
                          <path d="M14 3H7a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V7z" />
                          <path d="M14 3v4h4" />
                        </svg>
                        <span className="truncate text-[8px] leading-none text-white/90">
                          {$t("elevate-your-brand-how-to-design")}
                        </span>
                      </span>
                      <span className="w-[27%] shrink-0 text-[7.5px] leading-none text-white/50">
                        {$t("8-june-2024")}
                      </span>
                      <span className="w-[15%] shrink-0">
                        <img src="/services/brand.jpg" alt="" className="block h-[13px] w-[24px] rounded-[4px] object-cover" loading="lazy" decoding="async" />
                      </span>
                    </span>
                    <span className="flex flex-1 items-center border-t border-white/8 px-3 py-[6px]">
                      <span className="flex min-w-0 flex-1 items-center gap-1.5 pr-2">
                        <svg viewBox="0 0 24 24" className="size-[9px] shrink-0" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="2" strokeLinejoin="round">
                          <path d="M14 3H7a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V7z" />
                          <path d="M14 3v4h4" />
                        </svg>
                        <span className="truncate text-[8px] leading-none text-white/90">
                          {$t("the-ultimate-guide-to-choosing-the")}
                        </span>
                      </span>
                      <span className="w-[27%] shrink-0 text-[7.5px] leading-none text-white/50">
                        {$t("10-may-2024")}
                      </span>
                      <span className="w-[15%] shrink-0">
                        <img src="/services/arch.jpg" alt="" className="block h-[13px] w-[24px] rounded-[4px] object-cover" loading="lazy" decoding="async" />
                      </span>
                    </span>
                    <span className="flex flex-1 items-center border-t border-white/8 px-3 py-[6px]">
                      <span className="flex min-w-0 flex-1 items-center gap-1.5 pr-2">
                        <svg viewBox="0 0 24 24" className="size-[9px] shrink-0" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="2" strokeLinejoin="round">
                          <path d="M14 3H7a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V7z" />
                          <path d="M14 3v4h4" />
                        </svg>
                        <span className="truncate text-[8px] leading-none text-white/90">
                          {$t("optimizing-your-website-s-user-experience")}
                        </span>
                      </span>
                      <span className="w-[27%] shrink-0 text-[7.5px] leading-none text-white/50">
                        {$t("23-april-2024")}
                      </span>
                      <span className="w-[15%] shrink-0">
                        <img src="/services/office.jpg" alt="" className="block h-[13px] w-[24px] rounded-[4px] object-cover" loading="lazy" decoding="async" />
                      </span>
                    </span>
                    <span className="flex flex-1 items-center border-t border-white/8 px-3 py-[6px]">
                      <span className="flex min-w-0 flex-1 items-center gap-1.5 pr-2">
                        <svg viewBox="0 0 24 24" className="size-[9px] shrink-0" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="2" strokeLinejoin="round">
                          <path d="M14 3H7a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V7z" />
                          <path d="M14 3v4h4" />
                        </svg>
                        <span className="truncate text-[8px] leading-none text-white/90">
                          {$t("visual-storytelling-how-to-craft-compelling")}
                        </span>
                      </span>
                      <span className="w-[27%] shrink-0 text-[7.5px] leading-none text-white/50">
                        {$t("12-april-2024")}
                      </span>
                      <span className="w-[15%] shrink-0">
                        <img src="/services/tee.jpg" alt="" className="block h-[13px] w-[24px] rounded-[4px] object-cover" loading="lazy" decoding="async" />
                      </span>
                    </span>
                    <span className="mt-auto flex items-center justify-between border-t border-white/8 px-3 py-2 text-[7px] leading-none text-white/40">
                      <span>
                        {$t("5-of-24-entries")}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="vv-anim-blink block size-[5px] rounded-full" style={{ background: "#0099FF" }} />
                        {$t("synced")}
                      </span>
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex flex-1 items-end justify-between gap-4 pl-2">
                <div className="flex min-w-0 flex-col gap-1.5">
                  <h2 className="font-display text-[16px] leading-[1.25] font-medium tracking-h3 lg:text-[21px]">
                    {$t("cms-dynamic-websites")}
                  </h2>
                  <p className="line-clamp-2 text-[13px] leading-[1.5] text-fg-muted lg:text-[14px]">
                    {$t("dynamic-sites-powered-by-an-intuitive")}
                  </p>
                </div>
                <span className="hidden shrink-0 rounded-[10px] bg-fg/10 px-4 py-2.5 text-[14px] leading-none font-medium text-fg transition-colors group-hover:bg-fg/20 group-hover:text-fg-strong lg:inline-flex">
                  {$t("explore")}
                </span>
              </div>
            </Link>
            <Link data-reveal href="/services/landing-pages-and-microsites" className="group relative flex flex-col gap-3 rounded-[6px] border border-fg/12 bg-bg/30 p-[6px] pb-3 backdrop-blur-[14px] lg:gap-5 lg:rounded-[12px] lg:p-[10px] lg:pb-4">
              <span aria-hidden className="vv-shine vv-shine-lyr-a pointer-events-none absolute inset-0 rounded-[inherit] pointer-coarse:hidden" style={{ padding: 1, animationDuration: "2.8s", backgroundImage: "conic-gradient(from calc(var(--vv-shine-a) - var(--vv-shine-w, 24deg)), transparent 0deg, #0099FF calc(var(--vv-shine-w, 24deg) / 2), #7ACAFF var(--vv-shine-w, 24deg), transparent calc(var(--vv-shine-w, 24deg) * 2), transparent 360deg)", mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", maskComposite: "exclude", WebkitMaskComposite: "xor" }} />
              <span aria-hidden className="vv-shine vv-shine-lyr-b pointer-events-none absolute inset-0 rounded-[inherit] pointer-coarse:hidden" style={{ padding: 1, animationDuration: "2.8s", backgroundImage: "conic-gradient(from calc(var(--vv-shine-b) - var(--vv-shine-w, 24deg)), transparent 0deg, #0099FF calc(var(--vv-shine-w, 24deg) / 2), #7ACAFF var(--vv-shine-w, 24deg), transparent calc(var(--vv-shine-w, 24deg) * 2), transparent 360deg)", mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", maskComposite: "exclude", WebkitMaskComposite: "xor" }} />
              <div className="relative overflow-hidden rounded-[3px] lg:rounded-[6px]">
                <div aria-hidden className="relative aspect-[16/10] overflow-hidden" style={{ background: "linear-gradient(168deg, #0B6BBE 0%, #084F92 46%, #052E58 100%)" }}>
                  <span className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(90% 80% at 18% 0%, rgba(255,255,255,0.16) 0%, transparent 55%)" }} />
                  <span className="pointer-events-none absolute inset-0" style={{ backgroundImage: "radial-gradient(rgba(255,255,255,0.17) 1px, transparent 1px)", backgroundSize: "13px 13px", maskImage: "radial-gradient(130% 110% at 50% 0%, #000 26%, transparent 76%)", WebkitMaskImage: "radial-gradient(130% 110% at 50% 0%, #000 26%, transparent 76%)" }} />
                  <div className="absolute top-[22%] bottom-0 left-[12%] w-[30%] overflow-hidden rounded-t-[4px] bg-[#101318] shadow-[0_16px_36px_-12px_rgba(0,8,18,0.75)]">
                    <img src="/approach/site-a.webp" alt="" className="block size-full object-cover object-top" loading="lazy" decoding="async" />
                  </div>
                  <div className="absolute top-[15%] right-[12%] bottom-0 w-[30%] overflow-hidden rounded-t-[4px] bg-[#101318] shadow-[0_16px_36px_-12px_rgba(0,8,18,0.75)]">
                    <img src="/approach/site-c.webp" alt="" className="block size-full object-cover object-top" loading="lazy" decoding="async" />
                  </div>
                  <div className="absolute top-[6%] bottom-0 left-1/2 z-10 w-[36%] -translate-x-1/2 overflow-hidden rounded-t-[4px] bg-[#101318] shadow-[0_20px_44px_-12px_rgba(0,6,14,0.9)]">
                    <img src="/approach/site-b.webp" alt="" className="vv-anim-scroll block h-[calc(100%+40px)] w-full object-cover object-top" loading="lazy" decoding="async" />
                  </div>
                </div>
              </div>
              <div className="flex flex-1 items-end justify-between gap-4 pl-2">
                <div className="flex min-w-0 flex-col gap-1.5">
                  <h2 className="font-display text-[16px] leading-[1.25] font-medium tracking-h3 lg:text-[21px]">
                    {$t("landing-pages-microsites")}
                  </h2>
                  <p className="line-clamp-2 text-[13px] leading-[1.5] text-fg-muted lg:text-[14px]">
                    {$t("focused-fast-loading-pages-created-to")}
                  </p>
                </div>
                <span className="hidden shrink-0 rounded-[10px] bg-fg/10 px-4 py-2.5 text-[14px] leading-none font-medium text-fg transition-colors group-hover:bg-fg/20 group-hover:text-fg-strong lg:inline-flex">
                  {$t("explore")}
                </span>
              </div>
            </Link>
            <Link data-reveal href="/services/consistent-identity" className="group relative flex flex-col gap-3 rounded-[6px] border border-fg/12 bg-bg/30 p-[6px] pb-3 backdrop-blur-[14px] lg:gap-5 lg:rounded-[12px] lg:p-[10px] lg:pb-4">
              <span aria-hidden className="vv-shine vv-shine-lyr-a pointer-events-none absolute inset-0 rounded-[inherit] pointer-coarse:hidden" style={{ padding: 1, animationDuration: "2.8s", backgroundImage: "conic-gradient(from calc(var(--vv-shine-a) - var(--vv-shine-w, 24deg)), transparent 0deg, #0099FF calc(var(--vv-shine-w, 24deg) / 2), #7ACAFF var(--vv-shine-w, 24deg), transparent calc(var(--vv-shine-w, 24deg) * 2), transparent 360deg)", mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", maskComposite: "exclude", WebkitMaskComposite: "xor" }} />
              <span aria-hidden className="vv-shine vv-shine-lyr-b pointer-events-none absolute inset-0 rounded-[inherit] pointer-coarse:hidden" style={{ padding: 1, animationDuration: "2.8s", backgroundImage: "conic-gradient(from calc(var(--vv-shine-b) - var(--vv-shine-w, 24deg)), transparent 0deg, #0099FF calc(var(--vv-shine-w, 24deg) / 2), #7ACAFF var(--vv-shine-w, 24deg), transparent calc(var(--vv-shine-w, 24deg) * 2), transparent 360deg)", mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", maskComposite: "exclude", WebkitMaskComposite: "xor" }} />
              <div className="relative overflow-hidden rounded-[3px] lg:rounded-[6px]">
                <div aria-hidden className="relative aspect-[16/10] overflow-hidden" style={{ background: "linear-gradient(168deg, #0B6BBE 0%, #084F92 46%, #052E58 100%)" }}>
                  <span className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(90% 80% at 18% 0%, rgba(255,255,255,0.16) 0%, transparent 55%)" }} />
                  <span className="pointer-events-none absolute inset-0" style={{ backgroundImage: "radial-gradient(rgba(255,255,255,0.17) 1px, transparent 1px)", backgroundSize: "13px 13px", maskImage: "radial-gradient(130% 110% at 50% 0%, #000 26%, transparent 76%)", WebkitMaskImage: "radial-gradient(130% 110% at 50% 0%, #000 26%, transparent 76%)" }} />
                  <div className="rounded-[9px] bg-[#18181B] shadow-[0_18px_40px_-14px_rgba(0,4,10,0.9)] absolute top-[4%] -bottom-[6%] left-[3%] w-[43%]">
                    <span className="flex items-center justify-between border-b border-white/8 px-3 py-2.5">
                      <span className="text-[9px] leading-none font-semibold text-white">
                        {$t("text")}
                      </span>
                      <span className="text-[10px] leading-none text-white/55">
                        {"+"}
                      </span>
                    </span>
                    <span className="flex items-center gap-2 px-3 py-[5.5px]">
                      <span className="w-[34%] shrink-0 text-[8px] leading-none text-white/60">
                        {$t("styles")}
                      </span>
                      <span className="rounded-[7px] bg-[#1E1E21] text-white/90 flex items-center gap-1.5 px-2 py-[4px] text-[8px] leading-none">
                        <span className="grid size-[11px] place-items-center rounded-[3.5px] bg-white/20 text-[7px] font-semibold text-white">
                          {$t("t")}
                        </span>
                        <span className="text-white/50">
                          {$t("select")}
                        </span>
                      </span>
                    </span>
                    <span className="flex items-center gap-2 px-3 py-[5.5px]">
                      <span className="w-[34%] shrink-0 text-[8px] leading-none text-white/60">
                        {$t("content")}
                      </span>
                      <span className="rounded-[7px] bg-[#1E1E21] text-white/90 px-2.5 py-[4.5px] text-[8px] leading-none">
                        {$t("visuvate")}
                      </span>
                    </span>
                    <span className="flex items-center gap-2 px-3 py-[5.5px]">
                      <span className="w-[34%] shrink-0 text-[8px] leading-none text-white/60">
                        {$t("font")}
                      </span>
                      <span className="rounded-[7px] bg-[#1E1E21] text-white/90 px-2.5 py-[4.5px] text-[8px] leading-none">
                        {$t("onest")}
                      </span>
                    </span>
                    <span className="flex items-center gap-2 px-3 py-[5.5px]">
                      <span className="w-[34%] shrink-0 text-[8px] leading-none text-white/60">
                        {$t("weight")}
                      </span>
                      <span className="rounded-[7px] bg-[#1E1E21] text-white/90 px-2.5 py-[4.5px] text-[8px] leading-none">
                        {$t("medium")}
                      </span>
                    </span>
                    <span className="flex items-center gap-2 px-3 py-[5.5px]">
                      <span className="w-[34%] shrink-0 text-[8px] leading-none text-white/60">
                        {$t("color")}
                      </span>
                      <span className="rounded-[7px] bg-[#1E1E21] text-white/90 flex items-center gap-1.5 px-2 py-[4px] text-[8px] leading-none">
                        <span className="block size-[11px] rounded-[3.5px] border border-white/25 bg-white" />
                        {$t("ffffff")}
                      </span>
                    </span>
                    <span className="flex items-center gap-2 px-3 py-[5.5px]">
                      <span className="w-[34%] shrink-0 text-[8px] leading-none text-white/60">
                        {$t("size")}
                      </span>
                      <span className="flex gap-1.5">
                        <span className="rounded-[7px] bg-[#1E1E21] text-white/90 px-2.5 py-[4.5px] text-[8px] leading-none">
                          16
                        </span>
                        <span className="rounded-[7px] bg-[#1E1E21] text-white/90 px-2 py-[4.5px] text-[8px] leading-none text-white/55">
                          {$t("pixels")}
                        </span>
                      </span>
                    </span>
                    <span className="flex items-center gap-2 px-3 py-[5.5px]">
                      <span className="w-[34%] shrink-0 text-[8px] leading-none text-white/60">
                        {$t("letter")}
                      </span>
                      <span className="flex gap-1.5">
                        <span className="rounded-[7px] bg-[#1E1E21] text-white/90 px-2.5 py-[4.5px] text-[8px] leading-none">
                          {"-2%"}
                        </span>
                        <span className="rounded-[7px] bg-[#1E1E21] text-white/90 px-2 py-[4.5px] text-[8px] leading-none text-white/55">
                          {$t("em")}
                        </span>
                      </span>
                    </span>
                    <span className="flex items-center gap-2 px-3 py-[5.5px]">
                      <span className="w-[34%] shrink-0 text-[8px] leading-none text-white/60">
                        {$t("line")}
                      </span>
                      <span className="flex gap-1.5">
                        <span className="rounded-[7px] bg-[#1E1E21] text-white/90 px-2.5 py-[4.5px] text-[8px] leading-none">
                          1.2
                        </span>
                        <span className="rounded-[7px] bg-[#1E1E21] text-white/90 px-2 py-[4.5px] text-[8px] leading-none text-white/55">
                          {$t("em")}
                        </span>
                      </span>
                    </span>
                    <span className="flex items-center gap-2 px-3 py-[5.5px]">
                      <span className="w-[34%] shrink-0 text-[8px] leading-none text-white/60">
                        {$t("align")}
                      </span>
                      <span className="rounded-[7px] bg-[#1E1E21] text-white/90 flex items-center divide-x divide-white/10">
                        <span className="px-2 py-[4.5px] text-white">
                          <span className="flex w-[12px] flex-col gap-[2px]">
                            <span className="block h-[1.5px] w-full rounded bg-current" />
                            <span className="block h-[1.5px] w-[7px] rounded bg-current self-start" />
                            <span className="block h-[1.5px] w-full rounded bg-current" />
                          </span>
                        </span>
                        <span className="px-2 py-[4.5px] text-white/40">
                          <span className="flex w-[12px] flex-col gap-[2px]">
                            <span className="block h-[1.5px] w-full rounded bg-current" />
                            <span className="block h-[1.5px] w-[7px] rounded bg-current self-center" />
                            <span className="block h-[1.5px] w-full rounded bg-current" />
                          </span>
                        </span>
                        <span className="px-2 py-[4.5px] text-white/40">
                          <span className="flex w-[12px] flex-col gap-[2px]">
                            <span className="block h-[1.5px] w-full rounded bg-current" />
                            <span className="block h-[1.5px] w-[7px] rounded bg-current self-end" />
                            <span className="block h-[1.5px] w-full rounded bg-current" />
                          </span>
                        </span>
                      </span>
                    </span>
                    <span className="flex items-center gap-2 px-3 py-[5.5px]">
                      <span className="w-[34%] shrink-0 text-[8px] leading-none text-white/60">
                        {$t("opentype")}
                      </span>
                      <span className="rounded-[7px] bg-[#1E1E21] text-white/90 flex items-center gap-1.5 px-2 py-[4px] text-[8px] leading-none">
                        <span className="relative h-[9px] w-[15px] rounded-full" style={{ background: "#0099FF" }}>
                          <span className="absolute top-1/2 right-[1.5px] size-[6px] -translate-y-1/2 rounded-full bg-white" />
                        </span>
                        {$t("enabled")}
                      </span>
                    </span>
                  </div>
                  <div className="rounded-[9px] bg-[#18181B] shadow-[0_18px_40px_-14px_rgba(0,4,10,0.9)] absolute top-[12%] -bottom-[6%] left-[33%] z-10 w-[36%]">
                    <span className="flex items-center justify-between border-b border-white/8 px-3 py-2.5">
                      <span className="text-[9px] leading-none font-semibold text-white">
                        {$t("fill")}
                      </span>
                      <span className="text-[10px] leading-none text-white/55">
                        {"×"}
                      </span>
                    </span>
                    <span className="mx-3 mt-2.5 flex items-center justify-between rounded-[7px] bg-[#1E1E21] p-[2px]">
                      <span className="grid flex-1 place-items-center rounded-[5px] py-[3px] bg-white/18">
                        <span className="block size-[9px] rounded-full" style={{ background: "#E8EAED" }} />
                      </span>
                      <span className="grid flex-1 place-items-center rounded-[5px] py-[3px] ">
                        <span className="block size-[9px] rounded-full" style={{ background: "rgba(255,255,255,0.35)" }} />
                      </span>
                      <span className="grid flex-1 place-items-center rounded-[5px] py-[3px] ">
                        <span className="block size-[9px] rounded-full" style={{ background: "radial-gradient(circle at 35% 35%, rgba(255,255,255,0.5), rgba(255,255,255,0.12))" }} />
                      </span>
                      <span className="grid flex-1 place-items-center rounded-[5px] py-[3px] ">
                        <span className="block size-[9px] rounded-full" style={{ background: "linear-gradient(90deg, rgba(255,255,255,0.5) 50%, rgba(255,255,255,0.12) 50%)" }} />
                      </span>
                      <span className="grid flex-1 place-items-center rounded-[5px] py-[3px] ">
                        <span className="block size-[9px] rounded-full" style={{ background: "conic-gradient(rgba(255,255,255,0.5), rgba(255,255,255,0.12), rgba(255,255,255,0.5))" }} />
                      </span>
                    </span>
                    <span className="relative mx-3 mt-2.5 block h-[62px] rounded-[7px]" style={{ background: "linear-gradient(180deg, rgba(0,0,0,0) 0%, #000 100%), linear-gradient(90deg, #fff 0%, #0099FF 100%)" }}>
                      <span className="absolute top-[24%] right-[16%] size-[9px] rounded-full border-2 border-white shadow" />
                    </span>
                    <span className="relative mx-3 mt-2.5 block h-[6px] rounded-full" style={{ background: "linear-gradient(90deg, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)" }}>
                      <span className="vv-anim-sweep absolute top-1/2 size-[10px] -translate-y-1/2 rounded-full border-2 border-white bg-[#0099FF] shadow" />
                    </span>
                    <span className="relative mx-3 mt-2 block h-[6px] rounded-full" style={{ backgroundImage: "linear-gradient(90deg, rgba(0,153,255,0) 0%, #0099FF 100%), repeating-linear-gradient(45deg, #555 0 3px, #888 3px 6px)" }}>
                      <span className="absolute top-1/2 right-0 size-[10px] -translate-y-1/2 rounded-full border-2 border-white bg-[#0099FF] shadow" />
                    </span>
                    <span className="mx-3 mt-2.5 flex gap-1.5">
                      <span className="rounded-[7px] bg-[#1E1E21] text-white/90 flex-1 px-2 py-[4.5px] text-[8px] leading-none">
                        {$t("0099ff")}
                      </span>
                      <span className="rounded-[7px] bg-[#1E1E21] text-white/90 px-2 py-[4.5px] text-[8px] leading-none text-white/70">
                        100%
                      </span>
                      <span className="rounded-[7px] bg-[#1E1E21] text-white/90 px-2 py-[4.5px] text-[8px] leading-none text-white/70">
                        {$t("hex")}
                      </span>
                    </span>
                    <span className="mt-2.5 block border-t border-white/8 px-3 pt-2 text-[8.5px] leading-none font-semibold text-white">
                      {$t("styles")}
                    </span>
                  </div>
                  <div className="rounded-[9px] bg-[#18181B] shadow-[0_18px_40px_-14px_rgba(0,4,10,0.9)] absolute top-[20%] right-[2%] -bottom-[6%] z-20 w-[36%]">
                    <span className="flex items-center justify-between border-b border-white/8 px-3 py-2.5">
                      <span className="text-[9px] leading-none font-semibold text-white">
                        {$t("shadow")}
                      </span>
                      <span className="text-[10px] leading-none text-white/55">
                        {"×"}
                      </span>
                    </span>
                    <span className="flex items-center gap-2 px-3 py-[5.5px]">
                      <span className="w-[34%] shrink-0 text-[8px] leading-none text-white/60">
                        {$t("type")}
                      </span>
                      <span className="rounded-[7px] bg-[#1E1E21] text-white/90 flex p-[2px]">
                        <span className="rounded-[5px] px-2 py-[4px] text-[7.5px] leading-none font-medium text-white/50">
                          {$t("box")}
                        </span>
                        <span className="rounded-[5px] px-2 py-[4px] text-[7.5px] leading-none font-medium bg-white/18 text-white">
                          {$t("realistic")}
                        </span>
                      </span>
                    </span>
                    <span className="flex items-center gap-2 px-3 py-[5.5px]">
                      <span className="w-[34%] shrink-0 text-[8px] leading-none text-white/60">
                        {$t("position")}
                      </span>
                      <span className="rounded-[7px] bg-[#1E1E21] text-white/90 flex p-[2px]">
                        <span className="rounded-[5px] px-2 py-[4px] text-[7.5px] leading-none font-medium bg-white/18 text-white">
                          {$t("outside")}
                        </span>
                        <span className="rounded-[5px] px-2 py-[4px] text-[7.5px] leading-none font-medium text-white/50">
                          {$t("inside")}
                        </span>
                      </span>
                    </span>
                    <span className="flex items-center gap-2 px-3 py-[5.5px]">
                      <span className="w-[34%] shrink-0 text-[8px] leading-none text-white/60">
                        {$t("color")}
                      </span>
                      <span className="rounded-[7px] bg-[#1E1E21] text-white/90 flex items-center gap-1.5 px-2 py-[4px] text-[8px] leading-none">
                        <span className="block size-[11px] rounded-[3.5px] border border-white/25 bg-black" />
                        {"#000000"}
                      </span>
                    </span>
                    <span className="flex items-center gap-2 px-3 py-[5.5px]">
                      <span className="w-[34%] shrink-0 text-[8px] leading-none text-white/60">
                        {$t("x")}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="rounded-[7px] bg-[#1E1E21] text-white/90 px-2.5 py-[4.5px] text-[8px] leading-none">
                          0
                        </span>
                        <span className="rounded-[7px] bg-[#1E1E21] text-white/90 flex divide-x divide-white/10">
                          <span className="px-2 py-[4.5px] text-[8px] leading-none text-white/60">
                            {"−"}
                          </span>
                          <span className="px-2 py-[4.5px] text-[8px] leading-none text-white/60">
                            {"+"}
                          </span>
                        </span>
                      </span>
                    </span>
                    <span className="flex items-center gap-2 px-3 py-[5.5px]">
                      <span className="w-[34%] shrink-0 text-[8px] leading-none text-white/60">
                        {$t("y")}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="rounded-[7px] bg-[#1E1E21] text-white/90 px-2.5 py-[4.5px] text-[8px] leading-none">
                          10
                        </span>
                        <span className="rounded-[7px] bg-[#1E1E21] text-white/90 flex divide-x divide-white/10">
                          <span className="px-2 py-[4.5px] text-[8px] leading-none text-white/60">
                            {"−"}
                          </span>
                          <span className="px-2 py-[4.5px] text-[8px] leading-none text-white/60">
                            {"+"}
                          </span>
                        </span>
                      </span>
                    </span>
                    <span className="flex items-center gap-2 px-3 py-[5.5px]">
                      <span className="w-[34%] shrink-0 text-[8px] leading-none text-white/60">
                        {$t("diffusion")}
                      </span>
                      <span className="rounded-[7px] bg-[#1E1E21] text-white/90 px-2.5 py-[4.5px] text-[8px] leading-none">
                        0.25
                      </span>
                      <span className="relative h-[3px] min-w-0 flex-1 rounded-full bg-white/15">
                        <span className="absolute top-1/2 size-[8px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow" style={{ left: "25%" }} />
                      </span>
                    </span>
                    <span className="flex items-center gap-2 px-3 py-[5.5px]">
                      <span className="w-[34%] shrink-0 text-[8px] leading-none text-white/60">
                        {$t("focus")}
                      </span>
                      <span className="rounded-[7px] bg-[#1E1E21] text-white/90 px-2.5 py-[4.5px] text-[8px] leading-none">
                        0.5
                      </span>
                      <span className="relative h-[3px] min-w-0 flex-1 rounded-full bg-white/15">
                        <span className="absolute top-1/2 size-[8px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow" style={{ left: "50%" }} />
                      </span>
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex flex-1 items-end justify-between gap-4 pl-2">
                <div className="flex min-w-0 flex-col gap-1.5">
                  <h2 className="font-display text-[16px] leading-[1.25] font-medium tracking-h3 lg:text-[21px]">
                    {$t("consistent-identity")}
                  </h2>
                  <p className="line-clamp-2 text-[13px] leading-[1.5] text-fg-muted lg:text-[14px]">
                    {$t("every-project-follows-a-unified-design")}
                  </p>
                </div>
                <span className="hidden shrink-0 rounded-[10px] bg-fg/10 px-4 py-2.5 text-[14px] leading-none font-medium text-fg transition-colors group-hover:bg-fg/20 group-hover:text-fg-strong lg:inline-flex">
                  {$t("explore")}
                </span>
              </div>
            </Link>
            <Link data-reveal href="/services/motion-and-interaction-design" className="group relative flex flex-col gap-3 rounded-[6px] border border-fg/12 bg-bg/30 p-[6px] pb-3 backdrop-blur-[14px] lg:gap-5 lg:rounded-[12px] lg:p-[10px] lg:pb-4">
              <span aria-hidden className="vv-shine vv-shine-lyr-a pointer-events-none absolute inset-0 rounded-[inherit] pointer-coarse:hidden" style={{ padding: 1, animationDuration: "2.8s", backgroundImage: "conic-gradient(from calc(var(--vv-shine-a) - var(--vv-shine-w, 24deg)), transparent 0deg, #0099FF calc(var(--vv-shine-w, 24deg) / 2), #7ACAFF var(--vv-shine-w, 24deg), transparent calc(var(--vv-shine-w, 24deg) * 2), transparent 360deg)", mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", maskComposite: "exclude", WebkitMaskComposite: "xor" }} />
              <span aria-hidden className="vv-shine vv-shine-lyr-b pointer-events-none absolute inset-0 rounded-[inherit] pointer-coarse:hidden" style={{ padding: 1, animationDuration: "2.8s", backgroundImage: "conic-gradient(from calc(var(--vv-shine-b) - var(--vv-shine-w, 24deg)), transparent 0deg, #0099FF calc(var(--vv-shine-w, 24deg) / 2), #7ACAFF var(--vv-shine-w, 24deg), transparent calc(var(--vv-shine-w, 24deg) * 2), transparent 360deg)", mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", maskComposite: "exclude", WebkitMaskComposite: "xor" }} />
              <div className="relative overflow-hidden rounded-[3px] lg:rounded-[6px]">
                <div aria-hidden className="relative aspect-[16/10] overflow-hidden" style={{ background: "linear-gradient(168deg, #0B6BBE 0%, #084F92 46%, #052E58 100%)" }}>
                  <span className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(90% 80% at 18% 0%, rgba(255,255,255,0.16) 0%, transparent 55%)" }} />
                  <span className="pointer-events-none absolute inset-0" style={{ backgroundImage: "radial-gradient(rgba(255,255,255,0.17) 1px, transparent 1px)", backgroundSize: "13px 13px", maskImage: "radial-gradient(130% 110% at 50% 0%, #000 26%, transparent 76%)", WebkitMaskImage: "radial-gradient(130% 110% at 50% 0%, #000 26%, transparent 76%)" }} />
                  <div className="absolute inset-x-[6%] top-[7%] bottom-0 flex flex-col overflow-hidden rounded-t-[5px] bg-[#07090D] shadow-[0_14px_34px_-14px_rgba(0,10,22,0.8)]">
                    <span className="flex items-center justify-between px-3 pt-2.5">
                      <span className="font-display text-[10px] leading-none font-medium text-white">
                        {$t("hero-entrance")}
                      </span>
                      <span className="flex items-center gap-1.5 text-[7.5px] leading-none text-white/50">
                        <span className="grid size-[13px] place-items-center rounded-full bg-white/10">
                          <svg viewBox="0 0 24 24" className="size-[7px]" fill="white">
                            <path d="M7 4.5l12 7.5-12 7.5z" />
                          </svg>
                        </span>
                        {$t("0-6s")}
                      </span>
                    </span>
                    <span className="relative mx-3 mt-2 block min-h-0 flex-1">
                      <svg viewBox="0 0 100 50" preserveAspectRatio="none" className="absolute inset-0 size-full" fill="none">
                        <path d="M 0 12.5 H 100" stroke="rgba(255,255,255,0.06)" strokeWidth="0.4" />
                        <path d="M 0 25 H 100" stroke="rgba(255,255,255,0.06)" strokeWidth="0.4" />
                        <path d="M 0 37.5 H 100" stroke="rgba(255,255,255,0.06)" strokeWidth="0.4" />
                        <path d="M 25 0 V 50" stroke="rgba(255,255,255,0.06)" strokeWidth="0.4" />
                        <path d="M 50 0 V 50" stroke="rgba(255,255,255,0.06)" strokeWidth="0.4" />
                        <path d="M 75 0 V 50" stroke="rgba(255,255,255,0.06)" strokeWidth="0.4" />
                        <path d="M 9 40 L 88 5" stroke="rgba(255,255,255,0.14)" strokeWidth="0.5" strokeDasharray="2 2.5" />
                        <path d="M 9 40 C 35 38, 45 5, 88 5" stroke="#3FA4FF" strokeWidth="1.1" strokeLinecap="round" style={{ filter: "drop-shadow(0 0 3px rgba(0,153,255,0.6))" }} />
                        <path d="M 9 40 L 35 38" stroke="rgba(255,255,255,0.35)" strokeWidth="0.5" />
                        <path d="M 88 5 L 45 5" stroke="rgba(255,255,255,0.35)" strokeWidth="0.5" />
                        <circle cx="35" cy="38" r="1.7" fill="white" />
                        <circle cx="45" cy="5" r="1.7" fill="white" />
                        <circle cx="9" cy="40" r="1.4" fill="#3FA4FF" />
                        <circle cx="88" cy="5" r="1.4" fill="#3FA4FF" />
                      </svg>
                      <span className="vv-anim-ball absolute size-[9px] rounded-full bg-white shadow-[0_0_8px_rgba(0,153,255,0.8)]" />
                    </span>
                    <span className="relative mx-3 mt-2 mb-2.5 block">
                      <span className="flex flex-col gap-1.5">
                        <span className="flex items-center gap-2">
                          <span className="w-[20%] shrink-0 truncate text-[7px] leading-none text-white/55">
                            {$t("hero")}
                          </span>
                          <span className="relative h-[9px] min-w-0 flex-1 rounded-full bg-white/6">
                            <span className="absolute top-0 bottom-0 rounded-full" style={{ left: "0%", width: "46%", background: "linear-gradient(90deg, #47B4FF, #0099FF)" }} />
                          </span>
                        </span>
                        <span className="flex items-center gap-2">
                          <span className="w-[20%] shrink-0 truncate text-[7px] leading-none text-white/55">
                            {$t("cards")}
                          </span>
                          <span className="relative h-[9px] min-w-0 flex-1 rounded-full bg-white/6">
                            <span className="absolute top-0 bottom-0 rounded-full" style={{ left: "15%", width: "40%", background: "linear-gradient(90deg, #47B4FF, #0099FF)" }} />
                          </span>
                        </span>
                        <span className="flex items-center gap-2">
                          <span className="w-[20%] shrink-0 truncate text-[7px] leading-none text-white/55">
                            {$t("nav")}
                          </span>
                          <span className="relative h-[9px] min-w-0 flex-1 rounded-full bg-white/6">
                            <span className="absolute top-0 bottom-0 rounded-full" style={{ left: "31%", width: "27%", background: "linear-gradient(90deg, #47B4FF, #0099FF)" }} />
                          </span>
                        </span>
                      </span>
                      <span className="pointer-events-none absolute top-[-3px] bottom-[-3px] left-[20%] right-0">
                        <span className="vv-anim-sweep absolute top-0 bottom-0 w-[1.5px] rounded-full bg-white shadow-[0_0_6px_rgba(255,255,255,0.7)]" />
                      </span>
                    </span>
                    <span className="flex items-center justify-between border-t border-white/8 px-3 py-2 text-[6.5px] leading-none text-white/40">
                      <span>
                        {$t("cubic-bezier-0-22-0-61")}
                      </span>
                      <span>
                        {$t("60-fps")}
                      </span>
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex flex-1 items-end justify-between gap-4 pl-2">
                <div className="flex min-w-0 flex-col gap-1.5">
                  <h2 className="font-display text-[16px] leading-[1.25] font-medium tracking-h3 lg:text-[21px]">
                    {$t("motion-interaction-design")}
                  </h2>
                  <p className="line-clamp-2 text-[13px] leading-[1.5] text-fg-muted lg:text-[14px]">
                    {$t("purposeful-motion-that-enhances-usability-and")}
                  </p>
                </div>
                <span className="hidden shrink-0 rounded-[10px] bg-fg/10 px-4 py-2.5 text-[14px] leading-none font-medium text-fg transition-colors group-hover:bg-fg/20 group-hover:text-fg-strong lg:inline-flex">
                  {$t("explore")}
                </span>
              </div>
            </Link>
            <Link data-reveal href="/services/ux-centric-strategy" className="group relative flex flex-col gap-3 rounded-[6px] border border-fg/12 bg-bg/30 p-[6px] pb-3 backdrop-blur-[14px] lg:gap-5 lg:rounded-[12px] lg:p-[10px] lg:pb-4">
              <span aria-hidden className="vv-shine vv-shine-lyr-a pointer-events-none absolute inset-0 rounded-[inherit] pointer-coarse:hidden" style={{ padding: 1, animationDuration: "2.8s", backgroundImage: "conic-gradient(from calc(var(--vv-shine-a) - var(--vv-shine-w, 24deg)), transparent 0deg, #0099FF calc(var(--vv-shine-w, 24deg) / 2), #7ACAFF var(--vv-shine-w, 24deg), transparent calc(var(--vv-shine-w, 24deg) * 2), transparent 360deg)", mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", maskComposite: "exclude", WebkitMaskComposite: "xor" }} />
              <span aria-hidden className="vv-shine vv-shine-lyr-b pointer-events-none absolute inset-0 rounded-[inherit] pointer-coarse:hidden" style={{ padding: 1, animationDuration: "2.8s", backgroundImage: "conic-gradient(from calc(var(--vv-shine-b) - var(--vv-shine-w, 24deg)), transparent 0deg, #0099FF calc(var(--vv-shine-w, 24deg) / 2), #7ACAFF var(--vv-shine-w, 24deg), transparent calc(var(--vv-shine-w, 24deg) * 2), transparent 360deg)", mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", maskComposite: "exclude", WebkitMaskComposite: "xor" }} />
              <div className="relative overflow-hidden rounded-[3px] lg:rounded-[6px]">
                <div aria-hidden className="relative aspect-[16/10] overflow-hidden" style={{ background: "linear-gradient(168deg, #0B6BBE 0%, #084F92 46%, #052E58 100%)" }}>
                  <span className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(90% 80% at 18% 0%, rgba(255,255,255,0.16) 0%, transparent 55%)" }} />
                  <span className="pointer-events-none absolute inset-0" style={{ backgroundImage: "radial-gradient(rgba(255,255,255,0.17) 1px, transparent 1px)", backgroundSize: "13px 13px", maskImage: "radial-gradient(130% 110% at 50% 0%, #000 26%, transparent 76%)", WebkitMaskImage: "radial-gradient(130% 110% at 50% 0%, #000 26%, transparent 76%)" }} />
                  <div className="pointer-events-none absolute inset-0 grid place-items-center">
                    <IconCloud images={["https://cdn.simpleicons.org/figma", "https://cdn.simpleicons.org/sketch", "https://cdn.simpleicons.org/framer", "https://cdn.simpleicons.org/miro", "https://cdn.simpleicons.org/notion", "https://cdn.simpleicons.org/hotjar", "https://cdn.simpleicons.org/googleanalytics", "https://cdn.simpleicons.org/react", "https://cdn.simpleicons.org/nextdotjs", "https://cdn.simpleicons.org/typescript", "https://cdn.simpleicons.org/tailwindcss", "https://cdn.simpleicons.org/javascript", "https://cdn.simpleicons.org/html5", "https://cdn.simpleicons.org/css", "https://cdn.simpleicons.org/nodedotjs", "https://cdn.simpleicons.org/git", "https://cdn.simpleicons.org/github", "https://cdn.simpleicons.org/webflow", "https://cdn.simpleicons.org/wordpress", "https://cdn.simpleicons.org/shopify"]} size={205} />
                  </div>
                </div>
              </div>
              <div className="flex flex-1 items-end justify-between gap-4 pl-2">
                <div className="flex min-w-0 flex-col gap-1.5">
                  <h2 className="font-display text-[16px] leading-[1.25] font-medium tracking-h3 lg:text-[21px]">
                    {$t("ux-centric-strategy")}
                  </h2>
                  <p className="line-clamp-2 text-[13px] leading-[1.5] text-fg-muted lg:text-[14px]">
                    {$t("design-grounded-in-user-behavior-and")}
                  </p>
                </div>
                <span className="hidden shrink-0 rounded-[10px] bg-fg/10 px-4 py-2.5 text-[14px] leading-none font-medium text-fg transition-colors group-hover:bg-fg/20 group-hover:text-fg-strong lg:inline-flex">
                  {$t("explore")}
                </span>
              </div>
            </Link>
            <Link data-reveal href="/services/performance-optimization" className="group relative flex flex-col gap-3 rounded-[6px] border border-fg/12 bg-bg/30 p-[6px] pb-3 backdrop-blur-[14px] lg:gap-5 lg:rounded-[12px] lg:p-[10px] lg:pb-4">
              <span aria-hidden className="vv-shine vv-shine-lyr-a pointer-events-none absolute inset-0 rounded-[inherit] pointer-coarse:hidden" style={{ padding: 1, animationDuration: "2.8s", backgroundImage: "conic-gradient(from calc(var(--vv-shine-a) - var(--vv-shine-w, 24deg)), transparent 0deg, #0099FF calc(var(--vv-shine-w, 24deg) / 2), #7ACAFF var(--vv-shine-w, 24deg), transparent calc(var(--vv-shine-w, 24deg) * 2), transparent 360deg)", mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", maskComposite: "exclude", WebkitMaskComposite: "xor" }} />
              <span aria-hidden className="vv-shine vv-shine-lyr-b pointer-events-none absolute inset-0 rounded-[inherit] pointer-coarse:hidden" style={{ padding: 1, animationDuration: "2.8s", backgroundImage: "conic-gradient(from calc(var(--vv-shine-b) - var(--vv-shine-w, 24deg)), transparent 0deg, #0099FF calc(var(--vv-shine-w, 24deg) / 2), #7ACAFF var(--vv-shine-w, 24deg), transparent calc(var(--vv-shine-w, 24deg) * 2), transparent 360deg)", mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", maskComposite: "exclude", WebkitMaskComposite: "xor" }} />
              <div className="relative overflow-hidden rounded-[3px] lg:rounded-[6px]">
                <div aria-hidden className="relative aspect-[16/10] overflow-hidden" style={{ background: "linear-gradient(168deg, #0B6BBE 0%, #084F92 46%, #052E58 100%)" }}>
                  <span className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(90% 80% at 18% 0%, rgba(255,255,255,0.16) 0%, transparent 55%)" }} />
                  <span className="pointer-events-none absolute inset-0" style={{ backgroundImage: "radial-gradient(rgba(255,255,255,0.17) 1px, transparent 1px)", backgroundSize: "13px 13px", maskImage: "radial-gradient(130% 110% at 50% 0%, #000 26%, transparent 76%)", WebkitMaskImage: "radial-gradient(130% 110% at 50% 0%, #000 26%, transparent 76%)" }} />
                  <div className="absolute inset-x-[6%] top-[8%] bottom-[8%] flex flex-col overflow-hidden rounded-[10px] border border-white/10 bg-[#07090D]">
                    <span className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(70% 55% at 50% 108%, rgba(0,120,220,0.32) 0%, rgba(0,80,160,0.1) 55%, transparent 80%)" }} />
                    <span className="relative flex items-center justify-center gap-1.5 pt-3 text-[9px] leading-none font-medium text-white">
                      <span className="font-display text-[11px] leading-none font-bold">
                        {$t("g")}
                      </span>
                      {$t("google-lighthouse")}
                    </span>
                    <span className="relative flex flex-1 items-center justify-center gap-[6%] px-3 pb-1">
                      <span className="flex flex-col items-center gap-1.5">
                        <span className="relative grid place-items-center size-[58px]">
                          <svg viewBox="0 0 80 80" className="vv-anim-ring absolute inset-0 size-full -rotate-90">
                            <circle cx="40" cy="40" r="34" stroke="rgba(255,255,255,0.09)" strokeWidth="4" fill="none" />
                            <circle className="vv-ring-run" cx="40" cy="40" r="34" stroke="#3FA4FF" strokeWidth="5" strokeLinecap="round" fill="none" strokeDasharray="213.6" strokeDashoffset="0" style={{ filter: "drop-shadow(0 0 5px rgba(0,153,255,0.7))" }} />
                          </svg>
                          <span className="vv-anim-score font-display leading-none font-medium text-white text-[12px]" />
                        </span>
                        <span className="text-[7.5px] leading-none text-white/65">
                          {$t("seo")}
                        </span>
                      </span>
                      <span className="flex flex-col items-center gap-1.5">
                        <span className="relative grid place-items-center size-[78px]">
                          <svg viewBox="0 0 80 80" className="vv-anim-ring absolute inset-0 size-full -rotate-90">
                            <circle cx="40" cy="40" r="34" stroke="rgba(255,255,255,0.09)" strokeWidth="4" fill="none" />
                            <circle className="vv-ring-run" cx="40" cy="40" r="34" stroke="#3FA4FF" strokeWidth="5" strokeLinecap="round" fill="none" strokeDasharray="213.6" strokeDashoffset="0" style={{ filter: "drop-shadow(0 0 5px rgba(0,153,255,0.7))" }} />
                          </svg>
                          <span className="vv-anim-score font-display leading-none font-medium text-white text-[16px]" />
                        </span>
                        <span className="text-[7.5px] leading-none text-white/65">
                          {$t("performance")}
                        </span>
                      </span>
                      <span className="flex flex-col items-center gap-1.5">
                        <span className="relative grid place-items-center size-[58px]">
                          <svg viewBox="0 0 80 80" className="vv-anim-ring absolute inset-0 size-full -rotate-90">
                            <circle cx="40" cy="40" r="34" stroke="rgba(255,255,255,0.09)" strokeWidth="4" fill="none" />
                            <circle className="vv-ring-run" cx="40" cy="40" r="34" stroke="#3FA4FF" strokeWidth="5" strokeLinecap="round" fill="none" strokeDasharray="213.6" strokeDashoffset="0" style={{ filter: "drop-shadow(0 0 5px rgba(0,153,255,0.7))" }} />
                          </svg>
                          <span className="vv-anim-score font-display leading-none font-medium text-white text-[12px]" />
                        </span>
                        <span className="text-[7.5px] leading-none text-white/65">
                          {$t("accessibility")}
                        </span>
                      </span>
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex flex-1 items-end justify-between gap-4 pl-2">
                <div className="flex min-w-0 flex-col gap-1.5">
                  <h2 className="font-display text-[16px] leading-[1.25] font-medium tracking-h3 lg:text-[21px]">
                    {$t("performance-optimization")}
                  </h2>
                  <p className="line-clamp-2 text-[13px] leading-[1.5] text-fg-muted lg:text-[14px]">
                    {$t("beautiful-design-means-little-without")}
                  </p>
                </div>
                <span className="hidden shrink-0 rounded-[10px] bg-fg/10 px-4 py-2.5 text-[14px] leading-none font-medium text-fg transition-colors group-hover:bg-fg/20 group-hover:text-fg-strong lg:inline-flex">
                  {$t("explore")}
                </span>
              </div>
            </Link>
            <Link data-reveal href="/services/maintenance-and-ongoing-support" className="group relative flex flex-col gap-3 rounded-[6px] border border-fg/12 bg-bg/30 p-[6px] pb-3 backdrop-blur-[14px] lg:gap-5 lg:rounded-[12px] lg:p-[10px] lg:pb-4">
              <span aria-hidden className="vv-shine vv-shine-lyr-a pointer-events-none absolute inset-0 rounded-[inherit] pointer-coarse:hidden" style={{ padding: 1, animationDuration: "2.8s", backgroundImage: "conic-gradient(from calc(var(--vv-shine-a) - var(--vv-shine-w, 24deg)), transparent 0deg, #0099FF calc(var(--vv-shine-w, 24deg) / 2), #7ACAFF var(--vv-shine-w, 24deg), transparent calc(var(--vv-shine-w, 24deg) * 2), transparent 360deg)", mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", maskComposite: "exclude", WebkitMaskComposite: "xor" }} />
              <span aria-hidden className="vv-shine vv-shine-lyr-b pointer-events-none absolute inset-0 rounded-[inherit] pointer-coarse:hidden" style={{ padding: 1, animationDuration: "2.8s", backgroundImage: "conic-gradient(from calc(var(--vv-shine-b) - var(--vv-shine-w, 24deg)), transparent 0deg, #0099FF calc(var(--vv-shine-w, 24deg) / 2), #7ACAFF var(--vv-shine-w, 24deg), transparent calc(var(--vv-shine-w, 24deg) * 2), transparent 360deg)", mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", maskComposite: "exclude", WebkitMaskComposite: "xor" }} />
              <div className="relative overflow-hidden rounded-[3px] lg:rounded-[6px]">
                <div aria-hidden className="relative aspect-[16/10] overflow-hidden" style={{ background: "linear-gradient(168deg, #0B6BBE 0%, #084F92 46%, #052E58 100%)" }}>
                  <span className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(90% 80% at 18% 0%, rgba(255,255,255,0.16) 0%, transparent 55%)" }} />
                  <span className="pointer-events-none absolute inset-0" style={{ backgroundImage: "radial-gradient(rgba(255,255,255,0.17) 1px, transparent 1px)", backgroundSize: "13px 13px", maskImage: "radial-gradient(130% 110% at 50% 0%, #000 26%, transparent 76%)", WebkitMaskImage: "radial-gradient(130% 110% at 50% 0%, #000 26%, transparent 76%)" }} />
                  <div className="absolute top-[8%] -bottom-[8%] right-0 left-[13%] flex flex-col overflow-hidden rounded-tl-[6px] bg-[#07090D] shadow-[0_14px_34px_-14px_rgba(0,10,22,0.8)]">
                    <span className="block px-3 pt-2.5 font-display text-[11px] leading-none font-medium text-white">
                      {$t("overview")}
                    </span>
                    <span className="mt-2 block border-t border-white/10" />
                    <span className="flex gap-[8%] px-3 pt-2">
                      <span className="flex flex-col gap-1">
                        <span className="flex items-center gap-1 text-[7px] leading-none text-white/50">
                          {$t("live-visitors")}
                          <span className="vv-anim-blink block size-[5px] rounded-full" style={{ background: "#0099FF" }} />
                        </span>
                        <span className="font-display text-[13px] leading-none font-medium text-white">
                          400
                        </span>
                      </span>
                      <span className="flex flex-col gap-1">
                        <span className="flex items-center gap-1 text-[7px] leading-none text-white/50">
                          {$t("unique-visitors")}
                        </span>
                        <span className="font-display text-[13px] leading-none font-medium text-white">
                          {$t("1-7m")}
                        </span>
                      </span>
                      <span className="flex flex-col gap-1">
                        <span className="flex items-center gap-1 text-[7px] leading-none text-white/50">
                          {$t("total-pageviews")}
                        </span>
                        <span className="font-display text-[13px] leading-none font-medium text-white">
                          {$t("3-2m")}
                        </span>
                      </span>
                    </span>
                    <span className="mt-1.5 ml-3 block text-[6.5px] leading-none text-white/35">
                      {$t("330k")}
                    </span>
                    <span className="relative mt-1 block min-h-0 flex-1">
                      <svg viewBox="0 0 100 34" preserveAspectRatio="none" className="absolute inset-0 size-full">
                        <defs>
                          <linearGradient id="vv-svc-an-v" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#A78BFA" stopOpacity="0.28" />
                            <stop offset="100%" stopColor="#A78BFA" stopOpacity="0" />
                          </linearGradient>
                          <linearGradient id="vv-svc-an-b" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#0099FF" stopOpacity="0.3" />
                            <stop offset="100%" stopColor="#0099FF" stopOpacity="0" />
                          </linearGradient>
                        </defs>
                        <polygon points="0,12 12,16 22,8 34,11 46,6 58,12 68,5 78,10 88,7 100,3 100,34 0,34" fill="url(#vv-svc-an-v)" />
                        <polyline points="0,12 12,16 22,8 34,11 46,6 58,12 68,5 78,10 88,7 100,3" fill="none" stroke="#A78BFA" strokeWidth="0.9" />
                        <polygon points="0,26 12,25.5 22,24 34,21.5 46,18 58,19.5 68,17 78,20.5 88,18 100,13.5 100,34 0,34" fill="url(#vv-svc-an-b)" />
                        <polyline points="0,26 12,25.5 22,24 34,21.5 46,18 58,19.5 68,17 78,20.5 88,18 100,13.5" fill="none" stroke="#0099FF" strokeWidth="0.9" />
                      </svg>
                    </span>
                  </div>
                  <span className="vv-anim-float absolute top-[57%] left-[4%] z-10 block w-[37%] rounded-[6px] border border-white/12 bg-[#101318]/70 px-2 py-1.5 shadow-[0_10px_26px_-10px_rgba(0,4,10,0.9)] backdrop-blur-[5px]">
                    <span className="block text-[6.5px] leading-none text-white/55">
                      {$t("october-13-2025")}
                    </span>
                    <span className="mt-1.5 block border-t border-white/10 pt-1.5">
                      <span className="flex items-center justify-between text-[7px] leading-none">
                        <span className="flex items-center gap-1 text-white/75">
                          <span className="block size-[4.5px] rounded-full" style={{ background: "#0099FF" }} />
                          {$t("pageviews")}
                        </span>
                        <span className="font-medium text-white">
                          258,156
                        </span>
                      </span>
                      <span className="mt-1 flex items-center justify-between text-[7px] leading-none">
                        <span className="flex items-center gap-1 text-white/75">
                          <span className="block size-[4.5px] rounded-full" style={{ background: "#A78BFA" }} />
                          {$t("visitors")}
                        </span>
                        <span className="font-medium text-white">
                          85,458
                        </span>
                      </span>
                    </span>
                  </span>
                </div>
              </div>
              <div className="flex flex-1 items-end justify-between gap-4 pl-2">
                <div className="flex min-w-0 flex-col gap-1.5">
                  <h2 className="font-display text-[16px] leading-[1.25] font-medium tracking-h3 lg:text-[21px]">
                    {$t("maintenance-ongoing-support")}
                  </h2>
                  <p className="line-clamp-2 text-[13px] leading-[1.5] text-fg-muted lg:text-[14px]">
                    {$t("keep-your-website-updated-secure-and")}
                  </p>
                </div>
                <span className="hidden shrink-0 rounded-[10px] bg-fg/10 px-4 py-2.5 text-[14px] leading-none font-medium text-fg transition-colors group-hover:bg-fg/20 group-hover:text-fg-strong lg:inline-flex">
                  {$t("explore")}
                </span>
              </div>
            </Link>
          </div>
        </RevealBatch>
      </main>
    </>
  );
}
