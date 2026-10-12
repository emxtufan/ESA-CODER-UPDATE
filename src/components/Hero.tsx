import React, { useState } from 'react';
import { Monitor, Tablet, Smartphone, Sparkles, Check, ChevronDown, Play, ExternalLink, Sliders, Layers, Eye } from 'lucide-react';
import { PROJECTS } from '../data/siteData';

interface HeroProps {
  onOpenContact: () => void;
  onOpenSchedule: () => void;
  onSelectProject?: (slug: string) => void;
}

export const Hero: React.FC<HeroProps> = ({ onOpenContact, onOpenSchedule, onSelectProject }) => {
  const [deviceMode, setDeviceMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [activeProjectIndex, setActiveProjectIndex] = useState(0);
  const [selectedPage, setSelectedPage] = useState('Hero');
  const [activeTab, setActiveTab] = useState<'pages' | 'layers' | 'assets'>('pages');

  const currentProject = PROJECTS[activeProjectIndex];

  const pages = [
    'Home',
    'Hero',
    'Tech Stack',
    'Introduction',
    'Featured Works',
    'Services',
    'Approach',
    'FAQs',
    'CTA',
    'Footer',
  ];

  return (
    <section id="hero" className="relative z-10 pt-[110px] pb-16 md:pt-[130px] md:pb-24 overflow-hidden">
      {/* Background ambient lighting */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-[250px] left-1/2 -z-10 h-[500px] w-[900px] -translate-x-1/2 opacity-25 blur-[120px] rounded-full"
        style={{
          background: 'radial-gradient(circle, #3b82f6 0%, #1e1b4b 60%, transparent 100%)',
        }}
      />

      <div className="mx-auto max-w-[1440px] px-6 md:px-8">
        {/* Hero Title & Pitch */}
        <div className="mx-auto max-w-4xl text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-[#2b2b2b] bg-[#101010]/90 px-3.5 py-1 text-xs font-medium text-[#c0c0c0] shadow-sm backdrop-blur-sm mb-6">
            <span className="size-1.5 rounded-full bg-[#3b82f6] shadow-[0_0_8px_#3b82f6]" />
            <span>Design In Details</span>
          </div>

          {/* Heading */}
          <h1 className="font-display text-[clamp(44px,6.8vw,86px)] font-medium leading-[1.02] tracking-[-0.04em] text-[#efefef]">
            <span className="block">
              Crafted <span className="font-normal italic font-serif text-[#ffffff] underline decoration-blue-500/40 decoration-wavy decoration-1 underline-offset-8">Websites</span>
            </span>
            <span className="block text-[#a0a0a0]">
              Lasting Impressions
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mt-5 text-[clamp(16px,1.8vw,20px)] leading-[1.5] text-[#8e8e8e] max-w-2xl mx-auto">
            Premium websites crafted for bold brands — design, high-performance code, and CMS under one roof.
          </p>

          {/* Action CTAs */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5">
            <button
              onClick={onOpenContact}
              className="inline-flex h-11 items-center justify-center rounded-full bg-[#ffffff] px-6 text-sm font-medium text-[#030303] transition-all duration-300 hover:bg-[#eaeaea] hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_30px_rgba(255,255,255,0.15)]"
            >
              Start a project
            </button>
            <button
              onClick={onOpenSchedule}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-[#2b2b2b] bg-[#121212]/80 px-5 text-sm font-medium text-[#dfdfdf] backdrop-blur-sm transition-all duration-300 hover:border-[#444] hover:bg-[#1a1a1a] hover:text-[#ffffff]"
            >
              <Sparkles className="size-4 text-blue-400" />
              <span>Book a 15-min call</span>
            </button>
          </div>
        </div>

        {/* Interactive Studio Preview Canvas */}
        <div className="mt-14 lg:mt-18 rounded-[16px] border border-[#222222] bg-[#0c0c0c] shadow-[0_24px_80px_rgba(0,0,0,0.8)] overflow-hidden">
          {/* Top Bar of Studio */}
          <div className="flex h-12 items-center justify-between border-b border-[#1e1e1e] bg-[#111111] px-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="size-3 rounded-full bg-[#ff5f56]" />
                <span className="size-3 rounded-full bg-[#ffbd2e]" />
                <span className="size-3 rounded-full bg-[#27c93f]" />
              </div>
              <div className="h-4 w-px bg-[#262626]" />
              <div className="flex items-center gap-2 text-xs font-mono text-[#888888]">
                <span>visuvate.studio</span>
                <span className="text-[#444]">/</span>
                <span className="text-[#cccccc]">{currentProject.title.toLowerCase().replace(/\s+/g, '-')}.canvas</span>
              </div>
            </div>

            {/* Canvas viewport modes */}
            <div className="hidden sm:flex items-center gap-1 rounded-lg border border-[#222] bg-[#161616] p-0.5">
              <button
                onClick={() => setDeviceMode('desktop')}
                aria-label="Desktop view"
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  deviceMode === 'desktop' ? 'bg-[#262626] text-white shadow-sm' : 'text-[#888] hover:text-[#ccc]'
                }`}
              >
                <Monitor className="size-3.5" />
                <span>1440px</span>
              </button>
              <button
                onClick={() => setDeviceMode('tablet')}
                aria-label="Tablet view"
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  deviceMode === 'tablet' ? 'bg-[#262626] text-white shadow-sm' : 'text-[#888] hover:text-[#ccc]'
                }`}
              >
                <Tablet className="size-3.5" />
                <span>768px</span>
              </button>
              <button
                onClick={() => setDeviceMode('mobile')}
                aria-label="Mobile view"
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  deviceMode === 'mobile' ? 'bg-[#262626] text-white shadow-sm' : 'text-[#888] hover:text-[#ccc]'
                }`}
              >
                <Smartphone className="size-3.5" />
                <span>375px</span>
              </button>
            </div>

            {/* Quick Switch Project / Preview */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded-md px-2 py-1 text-xs text-[#bbb]">
                <span>Work:</span>
                <select
                  aria-label="Select work showcase"
                  value={activeProjectIndex}
                  onChange={(e) => setActiveProjectIndex(Number(e.target.value))}
                  className="bg-transparent text-white font-medium focus:outline-none cursor-pointer"
                >
                  {PROJECTS.map((proj, idx) => (
                    <option key={proj.id} value={idx} className="bg-[#111] text-white">
                      {proj.title}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => onSelectProject && onSelectProject(currentProject.slug)}
                className="hidden md:flex items-center gap-1 rounded-md bg-[#2563eb] px-2.5 py-1 text-xs font-medium text-white hover:bg-[#1d4ed8] transition-colors"
              >
                <Play className="size-3 fill-current" />
                <span>Preview</span>
              </button>
            </div>
          </div>

          {/* Main 3-Column Studio Workspace */}
          <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr_240px] min-h-[580px] bg-[#070707]">
            {/* Left Column: Pages & Layers Tree */}
            <div className="hidden lg:flex flex-col border-r border-[#1a1a1a] bg-[#0d0d0d]">
              {/* Tabs */}
              <div className="grid grid-cols-3 border-b border-[#1a1a1a] text-center text-[11px] font-medium text-[#777]">
                <button
                  onClick={() => setActiveTab('pages')}
                  className={`py-2.5 transition-colors border-b ${
                    activeTab === 'pages' ? 'border-blue-500 text-white font-semibold' : 'border-transparent hover:text-white'
                  }`}
                >
                  Pages
                </button>
                <button
                  onClick={() => setActiveTab('layers')}
                  className={`py-2.5 transition-colors border-b ${
                    activeTab === 'layers' ? 'border-blue-500 text-white font-semibold' : 'border-transparent hover:text-white'
                  }`}
                >
                  Layers
                </button>
                <button
                  onClick={() => setActiveTab('assets')}
                  className={`py-2.5 transition-colors border-b ${
                    activeTab === 'assets' ? 'border-blue-500 text-white font-semibold' : 'border-transparent hover:text-white'
                  }`}
                >
                  Assets
                </button>
              </div>

              {/* Tree content */}
              <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
                <div className="px-2 py-1.5 text-[10px] uppercase font-mono tracking-wider text-[#555]">
                  Document Outline
                </div>
                {pages.map((p) => (
                  <button
                    key={p}
                    onClick={() => setSelectedPage(p)}
                    className={`w-full flex items-center justify-between rounded-md px-2.5 py-1.5 text-xs text-left transition-colors ${
                      selectedPage === p
                        ? 'bg-[#1e1e1e] text-white font-medium'
                        : 'text-[#888] hover:bg-[#141414] hover:text-[#ccc]'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Layers className="size-3 text-[#555]" />
                      <span className="truncate">{p}</span>
                    </div>
                    {selectedPage === p && <span className="size-1.5 rounded-full bg-blue-500" />}
                  </button>
                ))}
              </div>

              {/* Bottom Quick Stats */}
              <div className="border-t border-[#1a1a1a] p-3 text-[11px] text-[#666] flex justify-between items-center">
                <span>FPS: 60</span>
                <span className="text-emerald-400 font-mono">Clean Code</span>
              </div>
            </div>

            {/* Center Column: Interactive Canvas Viewport */}
            <div className="flex flex-col items-center justify-center p-4 md:p-8 bg-[#090909] relative overflow-hidden">
              {/* Dynamic canvas frame */}
              <div
                className={`transition-all duration-500 ease-brand bg-[#111111] rounded-xl border border-[#222222] shadow-[0_20px_60px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col ${
                  deviceMode === 'desktop'
                    ? 'w-full max-w-[880px]'
                    : deviceMode === 'tablet'
                    ? 'w-[520px]'
                    : 'w-[320px]'
                }`}
              >
                {/* Browser bar inside viewport */}
                <div className="flex items-center justify-between border-b border-[#1e1e1e] bg-[#161616] px-3 py-2 text-xs text-[#888]">
                  <div className="flex items-center gap-2">
                    <span className="size-2 rounded-full bg-emerald-500" />
                    <span className="font-mono text-[11px] text-[#aaa]">{currentProject.title}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase tracking-wider bg-[#222] px-1.5 py-0.5 rounded text-[#999]">
                      {currentProject.category}
                    </span>
                    <a
                      href="#works"
                      className="hover:text-white transition-colors"
                      title="View project details"
                    >
                      <ExternalLink className="size-3" />
                    </a>
                  </div>
                </div>

                {/* Screenshot / Interactive Project Preview */}
                <div className="relative aspect-[16/10] w-full bg-[#050505] overflow-hidden group">
                  <img
                    src={deviceMode === 'mobile' ? currentProject.mobile : currentProject.desktop}
                    alt={currentProject.title}
                    className="w-full h-full object-cover object-top transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                    loading="lazy"
                  />

                  {/* Overlay vignette */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 opacity-90 pointer-events-none" />

                  {/* Floating card badge */}
                  <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between rounded-lg bg-black/60 p-3 backdrop-blur-md border border-white/10 text-white">
                    <div>
                      <h4 className="text-sm font-semibold tracking-tight">{currentProject.title}</h4>
                      <p className="text-xs text-[#aaa] line-clamp-1">{currentProject.description}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded">
                        {currentProject.year}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick interactive project navigator below canvas */}
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                {PROJECTS.slice(0, 5).map((proj, idx) => (
                  <button
                    key={proj.id}
                    onClick={() => setActiveProjectIndex(idx)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
                      activeProjectIndex === idx
                        ? 'bg-white text-black font-semibold shadow-md'
                        : 'bg-[#151515] text-[#888] border border-[#252525] hover:text-white hover:border-[#383838]'
                    }`}
                  >
                    {proj.title}
                  </button>
                ))}
              </div>
            </div>

            {/* Right Column: Studio Inspector */}
            <div className="hidden lg:flex flex-col border-l border-[#1a1a1a] bg-[#0d0d0d] p-3 text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-[#1a1a1a]">
                <div className="flex items-center gap-1.5 font-medium text-[#ccc]">
                  <Sliders className="size-3.5 text-blue-400" />
                  <span>Design Inspector</span>
                </div>
                <Eye className="size-3.5 text-[#555]" />
              </div>

              <div className="flex-1 overflow-y-auto pt-3 space-y-4">
                {/* Section: Size */}
                <div className="space-y-1.5">
                  <div className="text-[11px] font-semibold text-[#888] uppercase tracking-wider">Canvas Size</div>
                  <div className="grid grid-cols-2 gap-2 font-mono">
                    <div className="rounded bg-[#161616] p-1.5 border border-[#222]">
                      <span className="text-[#555] text-[10px]">W:</span> <span className="text-[#eee]">1440px</span>
                    </div>
                    <div className="rounded bg-[#161616] p-1.5 border border-[#222]">
                      <span className="text-[#555] text-[10px]">H:</span> <span className="text-[#eee]">Auto</span>
                    </div>
                  </div>
                </div>

                {/* Section: Layout */}
                <div className="space-y-1.5">
                  <div className="text-[11px] font-semibold text-[#888] uppercase tracking-wider">Layout Engine</div>
                  <div className="rounded bg-[#161616] p-2 border border-[#222] space-y-1.5 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-[#777]">Flow:</span>
                      <span className="text-white">Flexbox + Grid</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#777]">Gap:</span>
                      <span className="text-white">16px / Fluid</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#777]">Direction:</span>
                      <span className="text-white">Row (Responsive)</span>
                    </div>
                  </div>
                </div>

                {/* Section: Effects */}
                <div className="space-y-1.5">
                  <div className="text-[11px] font-semibold text-[#888] uppercase tracking-wider">Visual Effects</div>
                  <div className="rounded bg-[#161616] p-2 border border-[#222] space-y-1.5 text-[11px]">
                    <div className="flex justify-between items-center">
                      <span className="text-[#777]">Glassmorphism</span>
                      <span className="text-emerald-400 flex items-center gap-1">
                        <Check className="size-3" /> Enabled
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[#777]">Motion Curves</span>
                      <span className="text-white font-mono text-[10px]">cubic-bezier</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[#777]">Starfield Video</span>
                      <span className="text-blue-400">4K High-Res</span>
                    </div>
                  </div>
                </div>

                {/* Section: Platform Target */}
                <div className="space-y-1.5">
                  <div className="text-[11px] font-semibold text-[#888] uppercase tracking-wider">Export Stacks</div>
                  <div className="flex flex-wrap gap-1 text-[10px]">
                    {['React 19', 'Next.js', 'Framer', 'Webflow', 'Shopify'].map((tag) => (
                      <span key={tag} className="rounded bg-[#1a1a1a] border border-[#262626] px-2 py-0.5 text-[#aaa]">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom Project Link */}
              <div className="pt-3 border-t border-[#1a1a1a]">
                <button
                  onClick={onOpenContact}
                  className="w-full py-2 rounded-md bg-[#ffffff] text-black font-semibold text-xs hover:bg-[#e0e0e0] transition-colors"
                >
                  Commission This Site
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
