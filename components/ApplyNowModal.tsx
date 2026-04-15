import React, { useState, useEffect } from "react";

interface ApplyNowModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "apply" | "brochure";
}

const API_BASE = "https://studycupsbackend-wb8p.onrender.com";

const STREAMS = ["MBA / Management", "B.Tech / Engineering", "MBBS / Medical", "Law (LLB)", "Design", "Commerce / BBA", "Other"];
const BUDGETS = ["Under ₹2 Lakh/yr", "₹2L – ₹5L/yr", "₹5L – ₹15L/yr", "Above ₹15L/yr"];
const TIMINGS = ["Morning (9AM–12PM)", "Afternoon (12PM–4PM)", "Evening (4PM–8PM)", "Any Time"];

const ApplyNowModal: React.FC<ApplyNowModalProps> = ({ isOpen, onClose, mode }) => {
  const [formData, setFormData] = useState({
    name: "", phone: "", email: "", stream: "", budget: "", timing: "", message: "",
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    sessionStorage.setItem("applyFormSubmitted", "true");
    try {
      const response = await fetch(`${API_BASE}/api/registration`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, intent: mode }),
      });
      if (!response.ok) { alert("Something went wrong. Please try again."); setLoading(false); return; }
      setIsSubmitted(true);
    } catch {
      alert("Server error. Please try later.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setIsSubmitted(false);
    setLoading(false);
    setFormData({ name: "", phone: "", email: "", stream: "", budget: "", timing: "", message: "" });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
      onClick={handleClose}
    >
      <div
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-[0_40px_100px_rgba(0,0,0,0.3)] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Close */}
        <button onClick={handleClose}
          className="absolute top-3 right-3 z-10 h-8 w-8 rounded-full border border-white/20 text-white/80 flex items-center justify-center hover:bg-white/20 transition text-lg">
          ✕
        </button>

        {!isSubmitted ? (
          <>
            {/* Header */}
            <div className="bg-gradient-to-r from-[#0a214a] to-[#1f4fa8] px-6 py-5">
              <h2 className="text-[18px] font-bold text-white">
                {mode === "brochure" ? "Register to Download Brochure" : "Book Free Counselling Session"}
              </h2>
              <p className="text-[12px] text-white/60 mt-1">
                Fill in your details — our expert will call you within 24 hours
              </p>
            </div>

            {/* Form */}
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Full Name *</label>
                  <input name="name" value={formData.name} onChange={handleChange} required
                    placeholder="Your name"
                    className="w-full h-10 rounded-xl border border-slate-200 px-3 text-[13px] focus:outline-none focus:border-[#1f4fa8] focus:ring-2 focus:ring-[#1f4fa8]/10" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Phone Number *</label>
                  <input name="phone" value={formData.phone} onChange={handleChange} required type="tel"
                    placeholder="+91 98765..."
                    className="w-full h-10 rounded-xl border border-slate-200 px-3 text-[13px] focus:outline-none focus:border-[#1f4fa8] focus:ring-2 focus:ring-[#1f4fa8]/10" />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Email Address</label>
                <input name="email" value={formData.email} onChange={handleChange} type="email"
                  placeholder="you@email.com"
                  className="w-full h-10 rounded-xl border border-slate-200 px-3 text-[13px] focus:outline-none focus:border-[#1f4fa8]" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Stream Interested In *</label>
                  <select name="stream" value={formData.stream} onChange={handleChange} required
                    className="w-full h-10 rounded-xl border border-slate-200 px-3 text-[13px] bg-white focus:outline-none focus:border-[#1f4fa8]">
                    <option value="">Select stream</option>
                    {STREAMS.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Annual Fee Budget</label>
                  <select name="budget" value={formData.budget} onChange={handleChange}
                    className="w-full h-10 rounded-xl border border-slate-200 px-3 text-[13px] bg-white focus:outline-none focus:border-[#1f4fa8]">
                    <option value="">Select budget</option>
                    {BUDGETS.map(b => <option key={b}>{b}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Preferred Call Timing</label>
                <select name="timing" value={formData.timing} onChange={handleChange}
                  className="w-full h-10 rounded-xl border border-slate-200 px-3 text-[13px] bg-white focus:outline-none focus:border-[#1f4fa8]">
                  <option value="">Select timing</option>
                  {TIMINGS.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Specific Questions / Requirements</label>
                <textarea name="message" value={formData.message} onChange={handleChange} rows={3}
                  placeholder="e.g. Looking for MBA colleges under 10 LPA in Delhi NCR with good placements..."
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-[13px] focus:outline-none focus:border-[#1f4fa8] resize-none" />
              </div>

              <button type="submit" onClick={handleSubmit} disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-amber-400 to-orange-500 text-[#0a1628] font-bold rounded-xl text-[14px] shadow hover:opacity-90 transition disabled:opacity-50">
                {loading ? "Submitting..." : "📞 Book Free Counselling →"}
              </button>

              <p className="text-center text-[10px] text-slate-400">
                By submitting, you agree to be contacted by StudyCups advisors. 100% free, no spam.
              </p>
            </div>
          </>
        ) : (
          <div className="text-center py-14 px-8">
            <div className="text-5xl mb-4">✅</div>
            <h2 className="text-[22px] font-bold text-slate-900 mb-2">Request Submitted!</h2>
            <p className="text-slate-500 text-[14px] mb-6">
              Our counsellor will call you within <strong>24 hours</strong> at <strong>{formData.phone}</strong>.
            </p>
            <button onClick={handleClose}
              className="px-8 py-3 bg-gradient-to-r from-[#1f4fa8] to-[#0a214a] text-white font-bold rounded-xl text-sm">
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ApplyNowModal;
