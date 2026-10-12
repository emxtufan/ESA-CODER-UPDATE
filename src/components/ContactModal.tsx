import React, { useState } from 'react';
import { X, Send, CheckCircle2, Sparkles, MessageCircle } from 'lucide-react';
import { SERVICES_LIST } from '../data/siteData';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ContactModal: React.FC<ContactModalProps> = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    service: SERVICES_LIST[0],
    budget: '$1,500 – $3,000',
    message: '',
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
    }, 800);
  };

  const handleReset = () => {
    setIsSubmitted(false);
    setFormData({
      name: '',
      email: '',
      service: SERVICES_LIST[0],
      budget: '$1,500 – $3,000',
      message: '',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-2xl border border-[#2b2b2b] bg-[#0c0c0c] p-6 md:p-8 shadow-2xl text-white">
        <button
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-5 right-5 size-8 grid place-items-center rounded-full bg-[#181818] text-[#888] hover:text-white hover:bg-[#252525] transition-colors"
        >
          <X className="size-4" />
        </button>

        {isSubmitted ? (
          <div className="py-8 text-center space-y-4">
            <div className="mx-auto size-16 rounded-full bg-emerald-950/60 border border-emerald-500/40 grid place-items-center text-emerald-400">
              <CheckCircle2 className="size-8" />
            </div>
            <h3 className="font-display text-2xl font-medium">Message Received!</h3>
            <p className="text-sm text-[#999] max-w-sm mx-auto">
              Thank you, <span className="text-white font-semibold">{formData.name}</span>. The Visuvate team will review your project brief and get back to you within 24 hours.
            </p>
            <div className="pt-4 flex items-center justify-center gap-3">
              <a
                href="https://api.whatsapp.com/send/?phone=919278388499&text=Hi"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-[#25D366]/20 border border-[#25D366]/40 px-4 py-2 text-xs font-medium text-[#25D366] hover:bg-[#25D366]/30 transition-colors"
              >
                <MessageCircle className="size-3.5" />
                <span>Chat on WhatsApp</span>
              </a>
              <button
                onClick={handleReset}
                className="rounded-full bg-white text-black px-5 py-2 text-xs font-semibold hover:bg-[#e0e0e0] transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-blue-400 mb-1">
                <Sparkles className="size-3.5" />
                <span>Start a Project</span>
              </div>
              <h3 className="font-display text-2xl md:text-3xl font-medium tracking-tight">
                Let's Build Something Bold
              </h3>
              <p className="text-xs text-[#888] mt-1">
                Tell us about your brand goals, expected timeline, and vision.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-medium text-[#aaa] mb-1">Your Name</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Alex Rivera"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-lg border border-[#262626] bg-[#141414] px-3.5 py-2.5 text-xs text-white placeholder-[#555] focus:border-blue-500 focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#aaa] mb-1">Work Email</label>
                <input
                  required
                  type="email"
                  placeholder="alex@company.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full rounded-lg border border-[#262626] bg-[#141414] px-3.5 py-2.5 text-xs text-white placeholder-[#555] focus:border-blue-500 focus:outline-none transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#aaa] mb-1">Service Type</label>
                  <select
                    value={formData.service}
                    onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                    className="w-full rounded-lg border border-[#262626] bg-[#141414] px-3 py-2.5 text-xs text-white focus:border-blue-500 focus:outline-none transition-colors"
                  >
                    {SERVICES_LIST.map((s) => (
                      <option key={s} value={s} className="bg-[#141414] text-white">
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#aaa] mb-1">Estimated Budget</label>
                  <select
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                    className="w-full rounded-lg border border-[#262626] bg-[#141414] px-3 py-2.5 text-xs text-white focus:border-blue-500 focus:outline-none transition-colors"
                  >
                    <option value="$1,500 – $3,000">$1,500 – $3,000</option>
                    <option value="$3,000 – $5,000">$3,000 – $5,000</option>
                    <option value="$5,000 – $10,000">$5,000 – $10,000</option>
                    <option value="$10,000+">$10,000+</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#aaa] mb-1">Project Details & Objectives</label>
                <textarea
                  rows={3}
                  placeholder="Share links, goals, target audience, or requirements..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full rounded-lg border border-[#262626] bg-[#141414] px-3.5 py-2.5 text-xs text-white placeholder-[#555] focus:border-blue-500 focus:outline-none transition-colors resize-none"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <span className="text-[11px] text-[#666]">
                Guaranteed reply within 24h
              </span>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-2.5 text-xs font-semibold text-black hover:bg-[#e0e0e0] transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <span>Sending...</span>
                ) : (
                  <>
                    <span>Submit Brief</span>
                    <Send className="size-3.5" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
