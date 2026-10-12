import React from 'react';
import { ArrowUpRight, Mail, Phone, MapPin, Globe } from 'lucide-react';
import { VisuvateLogo } from './VisuvateLogo';

interface FooterProps {
  onOpenContact: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenContact }) => {
  return (
    <footer className="relative z-10 bg-[#030303] text-[#efefef] border-t border-[#1a1a1a] overflow-hidden">
      <div className="mx-auto max-w-[1440px] px-6 md:px-8 pt-16 pb-12">
        {/* Top Socials Strip */}
        <div className="border border-[#1f1f1f] rounded-2xl bg-[#080808] overflow-hidden mb-16">
          <ul className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-[#1f1f1f]">
            <li>
              <a
                href="https://www.instagram.com/visuvate"
                target="_blank"
                rel="noreferrer"
                className="group flex h-14 md:h-16 items-center justify-between px-6 text-xs md:text-sm text-[#aaa] hover:text-white transition-colors"
              >
                <span>Instagram</span>
                <ArrowUpRight className="size-4 text-[#555] group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
              </a>
            </li>
            <li>
              <a
                href="https://linkedin.com/company/visuvate"
                target="_blank"
                rel="noreferrer"
                className="group flex h-14 md:h-16 items-center justify-between px-6 text-xs md:text-sm text-[#aaa] hover:text-white transition-colors"
              >
                <span>LinkedIn</span>
                <ArrowUpRight className="size-4 text-[#555] group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
              </a>
            </li>
            <li>
              <a
                href="https://x.com/visuvate"
                target="_blank"
                rel="noreferrer"
                className="group flex h-14 md:h-16 items-center justify-between px-6 text-xs md:text-sm text-[#aaa] hover:text-white transition-colors"
              >
                <span>Twitter / X</span>
                <ArrowUpRight className="size-4 text-[#555] group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
              </a>
            </li>
            <li>
              <a
                href="https://api.whatsapp.com/send/?phone=919278388499&text=Hi"
                target="_blank"
                rel="noreferrer"
                className="group flex h-14 md:h-16 items-center justify-between px-6 text-xs md:text-sm text-[#aaa] hover:text-white transition-colors"
              >
                <span>WhatsApp</span>
                <ArrowUpRight className="size-4 text-[#555] group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
              </a>
            </li>
          </ul>

          {/* 4 Navigation Columns */}
          <div className="grid grid-cols-2 md:grid-cols-4 border-t border-[#1f1f1f] p-6 md:p-10 gap-8">
            {/* Column 1: Company */}
            <div>
              <h3 className="text-xs font-mono uppercase tracking-wider text-[#666] mb-4">
                Company
              </h3>
              <ul className="space-y-2.5 text-xs md:text-sm text-[#999]">
                <li><a href="#about" className="hover:text-white transition-colors">About Visuvate</a></li>
                <li><a href="#works" className="hover:text-white transition-colors">Featured Works</a></li>
                <li><a href="#approach" className="hover:text-white transition-colors">Our Approach</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing & Packages</a></li>
              </ul>
            </div>

            {/* Column 2: Services */}
            <div>
              <h3 className="text-xs font-mono uppercase tracking-wider text-[#666] mb-4">
                Services
              </h3>
              <ul className="space-y-2.5 text-xs md:text-sm text-[#999]">
                <li><a href="#services" className="hover:text-white transition-colors">Crafted Websites</a></li>
                <li><a href="#services" className="hover:text-white transition-colors">Website Redesign</a></li>
                <li><a href="#services" className="hover:text-white transition-colors">eCommerce Architecture</a></li>
                <li><a href="#services" className="hover:text-white transition-colors">CMS & Dynamic Systems</a></li>
              </ul>
            </div>

            {/* Column 3: Resources */}
            <div>
              <h3 className="text-xs font-mono uppercase tracking-wider text-[#666] mb-4">
                Resources
              </h3>
              <ul className="space-y-2.5 text-xs md:text-sm text-[#999]">
                <li><a href="#faqs" className="hover:text-white transition-colors">Frequently Asked Questions</a></li>
                <li><a href="#hero" className="hover:text-white transition-colors">Design Inspector</a></li>
                <li><a href="#services" className="hover:text-white transition-colors">Platform Ecosystem</a></li>
                <li><button onClick={onOpenContact} className="hover:text-white transition-colors text-left">Request Scoping</button></li>
              </ul>
            </div>

            {/* Column 4: Contact */}
            <div>
              <h3 className="text-xs font-mono uppercase tracking-wider text-[#666] mb-4">
                Contact
              </h3>
              <ul className="space-y-2.5 text-xs md:text-sm text-[#999]">
                <li>
                  <a href="mailto:contact@visuvate.com" className="flex items-center gap-2 hover:text-white transition-colors">
                    <Mail className="size-3.5 text-[#666]" />
                    <span>contact@visuvate.com</span>
                  </a>
                </li>
                <li>
                  <a href="tel:+919278388499" className="flex items-center gap-2 hover:text-white transition-colors">
                    <Phone className="size-3.5 text-[#666]" />
                    <span>+91 9278388499</span>
                  </a>
                </li>
                <li className="flex items-center gap-2 text-[#777]">
                  <MapPin className="size-3.5" />
                  <span>Based in India</span>
                </li>
                <li className="flex items-center gap-2 text-[#777]">
                  <Globe className="size-3.5" />
                  <span>Serving US, UK & Global Clients</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Big Watermark Logo Graphic */}
        <div className="relative py-8 flex justify-center items-center opacity-30 select-none pointer-events-none">
          <img
            src="/brand/footer-mark.webp"
            alt="Visuvate Brand Mark"
            className="w-full max-w-[800px] h-auto object-contain"
            loading="lazy"
          />
        </div>

        {/* Bottom Copyright Bar */}
        <div className="pt-8 border-t border-[#1a1a1a] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#666]">
          <div className="flex items-center gap-2">
            <VisuvateLogo className="h-3.5 w-auto text-[#888]" />
            <span>© 2026 Visuvate. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-6">
            <span className="text-[#555]">Premium Web Design Studio</span>
            <span className="text-[#555]">Built in React 19</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
