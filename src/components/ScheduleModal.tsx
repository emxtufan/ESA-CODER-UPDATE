import React, { useState } from 'react';
import { X, Calendar, Clock, CheckCircle2 } from 'lucide-react';

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ScheduleModal: React.FC<ScheduleModalProps> = ({ isOpen, onClose }) => {
  const [selectedDate, setSelectedDate] = useState('Tomorrow');
  const [selectedTime, setSelectedTime] = useState('14:00 (GMT+5:30)');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [booked, setBooked] = useState(false);

  if (!isOpen) return null;

  const dates = ['Today', 'Tomorrow', 'In 2 Days', 'In 3 Days'];
  const times = ['11:00 (GMT+5:30)', '14:00 (GMT+5:30)', '16:30 (GMT+5:30)', '19:00 (GMT+5:30)'];

  const handleBook = (e: React.FormEvent) => {
    e.preventDefault();
    setBooked(true);
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl border border-[#2b2b2b] bg-[#0c0c0c] p-6 md:p-8 shadow-2xl text-white">
        <button
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-5 right-5 size-8 grid place-items-center rounded-full bg-[#181818] text-[#888] hover:text-white hover:bg-[#252525] transition-colors"
        >
          <X className="size-4" />
        </button>

        {booked ? (
          <div className="py-8 text-center space-y-4">
            <div className="mx-auto size-16 rounded-full bg-blue-950/60 border border-blue-500/40 grid place-items-center text-blue-400">
              <CheckCircle2 className="size-8" />
            </div>
            <h3 className="font-display text-2xl font-medium">Call Scheduled!</h3>
            <p className="text-xs text-[#999] max-w-xs mx-auto">
              A Google Meet invite has been scheduled for <span className="text-white font-medium">{selectedDate} at {selectedTime}</span>. A calendar invitation has been sent to {email || 'your email'}.
            </p>
            <div className="pt-4">
              <button
                onClick={() => {
                  setBooked(false);
                  onClose();
                }}
                className="rounded-full bg-white text-black px-6 py-2 text-xs font-semibold hover:bg-[#e0e0e0] transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleBook} className="space-y-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-blue-400 mb-1">
                <Calendar className="size-3.5" />
                <span>15-Minute Intro</span>
              </div>
              <h3 className="font-display text-2xl font-medium tracking-tight">
                Book a Strategy Call
              </h3>
              <p className="text-xs text-[#888] mt-1">
                Quick 15-minute video call to discuss your website objectives, architecture, and timeline.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-[11px] font-medium text-[#aaa] mb-1.5 flex items-center gap-1">
                  <Calendar className="size-3" /> Select Date
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {dates.map((d) => (
                    <button
                      type="button"
                      key={d}
                      onClick={() => setSelectedDate(d)}
                      className={`py-2 px-3 rounded-lg text-xs font-medium border text-center transition-all ${
                        selectedDate === d
                          ? 'border-blue-500 bg-blue-950/40 text-white'
                          : 'border-[#222] bg-[#141414] text-[#888] hover:text-white'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[#aaa] mb-1.5 flex items-center gap-1">
                  <Clock className="size-3" /> Select Time Slot
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {times.map((t) => (
                    <button
                      type="button"
                      key={t}
                      onClick={() => setSelectedTime(t)}
                      className={`py-2 px-3 rounded-lg text-[11px] font-medium border text-center transition-all ${
                        selectedTime === t
                          ? 'border-blue-500 bg-blue-950/40 text-white'
                          : 'border-[#222] bg-[#141414] text-[#888] hover:text-white'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[#aaa] mb-1">Your Name</label>
                <input
                  required
                  type="text"
                  placeholder="Your Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-[#262626] bg-[#141414] px-3 py-2 text-xs text-white placeholder-[#555] focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[#aaa] mb-1">Your Email</label>
                <input
                  required
                  type="email"
                  placeholder="email@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-[#262626] bg-[#141414] px-3 py-2 text-xs text-white placeholder-[#555] focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full rounded-full bg-white py-2.5 text-xs font-semibold text-black hover:bg-[#e0e0e0] transition-colors cursor-pointer"
              >
                Confirm Booking
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
