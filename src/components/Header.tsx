import React, { useState, useEffect } from 'react';
import { VisuvateLogo } from './VisuvateLogo';

interface HeaderProps {
  onOpenContact: () => void;
  onOpenSchedule: () => void;
  darkMode: boolean;
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenContact,
  onOpenSchedule: _onOpenSchedule,
  darkMode,
  onToggleTheme,
}) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Home', href: '#' },
    { label: 'About Us', href: '#about' },
    { label: 'Works', href: '#works' },
    { label: 'Services', href: '#services' },
    { label: 'Blogs', href: '#approach' },
    { label: 'Templates', href: '#pricing' },
  ];

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-[200] transition-[padding,background-color,border-color,backdrop-filter] duration-500 ease-brand ${
          scrolled
            ? 'border-b border-[#222222]/80 bg-[#030303]/80 backdrop-blur-md py-1'
            : 'border-b border-transparent bg-transparent py-0'
        }`}
      >
        <div className="mx-auto grid max-w-[1380px] grid-cols-[auto_1fr] items-center gap-5 px-6 py-4 transition-[max-width,padding,background-color,border-radius,box-shadow,backdrop-filter] duration-500 ease-brand min-[981px]:grid-cols-[1fr_auto_1fr] md:px-8">
          {/* Logo */}
          <a
            aria-label="Visuvate — home"
            className="flex items-center justify-self-start text-[#efefef] hover:opacity-90 transition-opacity"
            href="#"
          >
            <VisuvateLogo className="h-5 w-auto" />
          </a>

          {/* Desktop Navigation */}
          <nav aria-label="Primary" className="hidden items-center gap-7 min-[981px]:flex">
            {navLinks.map((link, idx) => (
              <a
                key={link.label}
                className={`text-[15px] tracking-[-0.01em] transition-colors duration-200 ${
                  idx === 0
                    ? 'font-medium text-[#efefef]'
                    : 'text-[#888888] hover:text-[#ffffff]'
                }`}
                href={link.href}
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Actions: Theme Toggle, Let's Connect CTA, Mobile Hamburger */}
          <div className="flex items-center gap-2 justify-self-end min-[981px]:gap-3.5">
            {/* Theme Toggle Button */}
            <button
              role="switch"
              type="button"
              aria-checked={!darkMode}
              aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              onClick={onToggleTheme}
              className="relative h-6 w-[46px] rounded-full border border-[#2e2e2e] bg-[#141414] transition-colors hover:border-[#444444]"
            >
              <span
                className={`absolute top-[2px] size-[18px] rounded-full transition-transform duration-300 bg-white ${
                  darkMode ? 'left-[2px]' : 'translate-x-[22px] left-[2px] bg-[#030303]'
                }`}
              />
            </button>

            {/* "Let's Connect" CTA Button */}
            <button
              onClick={onOpenContact}
              className="group inline-flex h-[38px] shrink-0 items-center rounded-full border border-transparent bg-[#efefef] px-4 text-[13px] font-medium tracking-[-0.01em] whitespace-nowrap text-[#030303] transition-all hover:bg-[#ffffff] hover:shadow-[0_0_24px_rgba(255,255,255,0.2)] min-[981px]:h-[36px] min-[981px]:px-[18px]"
            >
              <span className="min-[981px]:hidden">
                <span className="sr-only">Connect</span>
                <span className="vv-roll" aria-hidden="true">
                  {['C', 'o', 'n', 'n', 'e', 'c', 't'].map((char, i) => (
                    <span key={i} className="vv-roll-char" style={{ '--i': i } as React.CSSProperties}>
                      <span>{char}</span>
                      <span>{char}</span>
                    </span>
                  ))}
                </span>
              </span>
              <span className="hidden min-[981px]:inline">
                <span className="sr-only">Let’s Connect</span>
                <span className="vv-roll" aria-hidden="true">
                  {['L', 'e', 't', '’', 's', ' ', 'C', 'o', 'n', 'n', 'e', 'c', 't'].map((char, i) => (
                    <span key={i} className="vv-roll-char" style={{ '--i': i } as React.CSSProperties}>
                      <span>{char}</span>
                      <span>{char}</span>
                    </span>
                  ))}
                </span>
              </span>
            </button>

            {/* Mobile Hamburger Toggle */}
            <button
              type="button"
              aria-expanded={mobileMenuOpen}
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="grid size-[42px] shrink-0 place-items-center rounded-full border border-[#2e2e2e] bg-[#141414] transition-colors duration-300 min-[981px]:hidden hover:border-[#444444]"
            >
              <span className="relative block h-[10px] w-4">
                <span
                  className={`absolute left-0 block h-[1.5px] w-full transition-[rotate,top,background-color] duration-[380ms] ease-brand bg-[#efefef] ${
                    mobileMenuOpen ? 'top-[4px] rotate-45' : 'top-0'
                  }`}
                />
                <span
                  className={`absolute left-0 block h-[1.5px] w-full transition-[rotate,top,background-color] duration-[380ms] ease-brand bg-[#efefef] ${
                    mobileMenuOpen ? 'top-[4px] -rotate-45' : 'top-[8.5px]'
                  }`}
                />
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[190] bg-[#030303]/95 backdrop-blur-xl min-[981px]:hidden pt-24 px-6 flex flex-col justify-between pb-8">
          <nav className="flex flex-col gap-6">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="text-2xl font-medium text-[#efefef] hover:text-white transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex flex-col gap-4 pt-8 border-t border-[#222222]">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenContact();
              }}
              className="w-full h-12 rounded-full bg-[#efefef] text-[#030303] font-medium text-base hover:bg-white transition-colors"
            >
              Start a project
            </button>
            <div className="flex items-center justify-between text-xs text-[#888888] pt-2">
              <span>contact@visuvate.com</span>
              <span>+91 9278388499</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
