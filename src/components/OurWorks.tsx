import React, { useState } from 'react';
import { ArrowUpRight, Monitor, Smartphone, Sparkles, Filter } from 'lucide-react';
import { PROJECTS, Project } from '../data/siteData';

interface OurWorksProps {
  onSelectProject: (project: Project) => void;
  onOpenContact: () => void;
}

export const OurWorks: React.FC<OurWorksProps> = ({ onSelectProject, onOpenContact }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [activeDeviceView, setActiveDeviceView] = useState<Record<string, 'desktop' | 'mobile'>>({});

  const categories = [
    'All',
    'Crafted Websites',
    'CMS & Dynamic Websites',
    'eCommerce Design',
    'Website Redesign',
  ];

  const filteredProjects = selectedCategory === 'All'
    ? PROJECTS
    : PROJECTS.filter((p) => p.category === selectedCategory);

  const toggleDevice = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveDeviceView((prev) => ({
      ...prev,
      [id]: prev[id] === 'mobile' ? 'desktop' : 'mobile',
    }));
  };

  return (
    <section id="works" className="relative z-10 bg-[#030303] py-24 md:py-32 border-t border-[#1a1a1a]">
      <div className="mx-auto max-w-[1440px] px-6 md:px-8">
        {/* Section Heading & Category Filter Controls */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-[0.2em] text-[#777] mb-3">
              <Sparkles className="size-3.5 text-blue-400" />
              <span>Selected Portfolio</span>
            </div>
            <h2 className="font-display text-[clamp(40px,5.5vw,72px)] font-medium leading-[1] tracking-[-0.04em] text-[#efefef]">
              Our <span className="text-[#ffffff] underline decoration-blue-500/40 decoration-1 underline-offset-8">Works</span>
            </h2>
          </div>

          {/* Interactive filter tabs */}
          <div className="flex flex-wrap items-center gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`rounded-full px-4 py-2 text-xs font-medium transition-all duration-200 cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-white text-black font-semibold shadow-[0_0_20px_rgba(255,255,255,0.2)]'
                    : 'bg-[#121212] text-[#888888] border border-[#222222] hover:text-white hover:border-[#333333]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10">
          {filteredProjects.map((project) => {
            const currentDevice = activeDeviceView[project.id] || 'desktop';
            const displayImage = currentDevice === 'mobile' ? project.mobile : project.desktop;

            return (
              <article
                key={project.id}
                onClick={() => onSelectProject(project)}
                className="group relative flex flex-col rounded-2xl border border-[#202020] bg-[#0c0c0c] overflow-hidden transition-all duration-500 hover:border-[#383838] hover:shadow-[0_20px_60px_rgba(0,0,0,0.8)] cursor-pointer"
              >
                {/* Media Image Showcase with aspect ratio */}
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#111111]">
                  <img
                    src={displayImage}
                    alt={project.title}
                    className="h-full w-full object-cover object-top transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                    loading="lazy"
                  />

                  {/* Gradient Scrim */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-300 pointer-events-none" />

                  {/* Top floating controls: Device view switcher */}
                  <div className="absolute top-4 right-4 flex items-center gap-1.5 rounded-full bg-black/70 p-1 backdrop-blur-md border border-white/10 z-10">
                    <button
                      onClick={(e) => toggleDevice(project.id, e)}
                      title={`Switch to ${currentDevice === 'desktop' ? 'Mobile' : 'Desktop'} view`}
                      className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-white hover:bg-white/20 rounded-full transition-colors"
                    >
                      {currentDevice === 'desktop' ? (
                        <>
                          <Smartphone className="size-3" />
                          <span>View Mobile</span>
                        </>
                      ) : (
                        <>
                          <Monitor className="size-3" />
                          <span>View Desktop</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Year Tag */}
                  <div className="absolute top-4 left-4 z-10">
                    <span className="rounded-full bg-black/60 backdrop-blur-md border border-white/10 px-3 py-1 text-[11px] font-mono text-[#aaa]">
                      {project.year}
                    </span>
                  </div>

                  {/* Hover Open Overlay Action */}
                  <div className="absolute inset-0 grid place-items-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                    <div className="size-14 rounded-full bg-white text-black flex items-center justify-center shadow-2xl scale-75 group-hover:scale-100 transition-transform duration-300">
                      <ArrowUpRight className="size-6" />
                    </div>
                  </div>
                </div>

                {/* Project Metadata & Content */}
                <div className="p-6 md:p-8 flex flex-col flex-1 justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-4">
                      <h3 className="font-display text-2xl font-medium tracking-tight text-[#efefef] group-hover:text-white transition-colors">
                        {project.title}
                      </h3>
                      <span className="text-xs uppercase font-mono tracking-wider text-[#777] bg-[#161616] border border-[#262626] px-2.5 py-1 rounded-full">
                        {project.category}
                      </span>
                    </div>

                    <p className="mt-3 text-sm leading-[1.6] text-[#8e8e8e]">
                      {project.description}
                    </p>
                  </div>

                  {/* Tags */}
                  <div className="mt-6 flex flex-wrap items-center justify-between gap-2 pt-4 border-t border-[#1c1c1c]">
                    <div className="flex flex-wrap gap-1.5">
                      {project.tags.map((t) => (
                        <span key={t} className="text-[11px] text-[#777]">
                          #{t}
                        </span>
                      ))}
                    </div>

                    <span className="text-xs font-medium text-[#c0c0c0] flex items-center gap-1 group-hover:text-white transition-colors">
                      Explore Case Study
                      <ArrowUpRight className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {/* Bottom CTA to start a project */}
        <div className="mt-16 text-center">
          <button
            onClick={onOpenContact}
            className="inline-flex items-center gap-2 rounded-full border border-[#2b2b2b] bg-[#101010] px-6 py-3 text-sm font-medium text-[#efefef] hover:border-[#444] hover:bg-[#181818] transition-all shadow-sm"
          >
            <span>Have a project in mind? Let's discuss your vision</span>
            <ArrowUpRight className="size-4 text-blue-400" />
          </button>
        </div>
      </div>
    </section>
  );
};
