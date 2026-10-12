import React, { useState } from 'react';
import { X, Monitor, Smartphone, ExternalLink, Calendar, Tag } from 'lucide-react';
import { Project } from '../data/siteData';

interface ProjectModalProps {
  project: Project | null;
  onClose: () => void;
  onOpenContact: () => void;
}

export const ProjectModal: React.FC<ProjectModalProps> = ({ project, onClose, onOpenContact }) => {
  const [deviceView, setDeviceView] = useState<'desktop' | 'mobile'>('desktop');

  if (!project) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-3 md:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-2xl border border-[#2b2b2b] bg-[#0c0c0c] shadow-2xl text-white overflow-hidden my-auto">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between border-b border-[#202020] bg-[#121212] px-6 py-4">
          <div className="flex items-center gap-3">
            <h3 className="font-display text-lg md:text-xl font-medium tracking-tight">
              {project.title}
            </h3>
            <span className="rounded-full bg-[#222] px-2.5 py-0.5 text-[11px] font-mono text-[#aaa]">
              {project.category}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 rounded-lg border border-[#262626] bg-[#181818] p-0.5">
              <button
                onClick={() => setDeviceView('desktop')}
                className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded-md transition-colors ${
                  deviceView === 'desktop' ? 'bg-[#2a2a2a] text-white' : 'text-[#888] hover:text-white'
                }`}
              >
                <Monitor className="size-3.5" />
                <span className="hidden sm:inline">Desktop</span>
              </button>
              <button
                onClick={() => setDeviceView('mobile')}
                className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded-md transition-colors ${
                  deviceView === 'mobile' ? 'bg-[#2a2a2a] text-white' : 'text-[#888] hover:text-white'
                }`}
              >
                <Smartphone className="size-3.5" />
                <span className="hidden sm:inline">Mobile</span>
              </button>
            </div>

            <button
              onClick={onClose}
              aria-label="Close modal"
              className="size-8 grid place-items-center rounded-full bg-[#181818] text-[#888] hover:text-white hover:bg-[#252525] transition-colors"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6 md:p-8 space-y-6">
          {/* Main Visual Display */}
          <div className="flex justify-center bg-[#050505] rounded-xl border border-[#1e1e1e] p-4 overflow-hidden">
            <div
              className={`transition-all duration-300 rounded-lg overflow-hidden border border-[#222] shadow-2xl ${
                deviceView === 'desktop' ? 'w-full max-w-[760px] aspect-[16/10]' : 'w-[280px] aspect-[9/16]'
              }`}
            >
              <img
                src={deviceView === 'desktop' ? project.desktop : project.mobile}
                alt={project.title}
                className="w-full h-full object-cover object-top"
              />
            </div>
          </div>

          {/* Details & Specs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            <div className="md:col-span-2 space-y-3">
              <h4 className="text-sm font-semibold uppercase tracking-wider text-[#888]">
                About The Project
              </h4>
              <p className="text-sm leading-[1.7] text-[#ccc]">
                {project.description} Custom responsive architecture with tailored animations, bespoke typography scales, and optimized media delivery.
              </p>
              <div className="flex flex-wrap gap-2 pt-2">
                {project.tags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 text-xs rounded-full bg-[#161616] border border-[#262626] px-3 py-1 text-[#aaa]"
                  >
                    <Tag className="size-3 text-[#666]" />
                    <span>{t}</span>
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-4 rounded-xl border border-[#202020] bg-[#111111] p-4 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-[#202020]">
                <span className="text-[#777]">Delivered Year:</span>
                <span className="font-mono text-white flex items-center gap-1">
                  <Calendar className="size-3 text-blue-400" /> {project.year}
                </span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-[#202020]">
                <span className="text-[#777]">Architecture:</span>
                <span className="text-white">Fluid Breakpoints</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-[#202020]">
                <span className="text-[#777]">Quality Score:</span>
                <span className="text-emerald-400 font-mono">100 / 100</span>
              </div>
              <button
                onClick={() => {
                  onClose();
                  onOpenContact();
                }}
                className="w-full rounded-full bg-white py-2.5 font-semibold text-black hover:bg-[#e0e0e0] transition-colors"
              >
                Inquire Similar Site
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
