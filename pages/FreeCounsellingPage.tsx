import React, { useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";

const STREAMS = ["MBA / Management", "B.Tech / Engineering", "MBBS / Medical", "Law (LLB)", "Design", "Commerce / BBA", "Other"];
const BUDGETS = ["Under ₹2 Lakh/yr", "₹2L – ₹5L/yr", "₹5L – ₹15L/yr", "Above ₹15L/yr"];
const TIMINGS = ["Morning (9AM–12PM)", "Afternoon (12PM–4PM)", "Evening (4PM–8PM)", "Any Time"];

const FreeCounsellingPage: React.FC = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "", phone: "", email: "", stream: "", budget: "", timing: "", message: ""
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.stream) return;
    setLoading(true);
    // Simulate API call
    await new Promise(r => setTimeout(r, 1200));
    setLoading(false);
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-[#f2f4f7]">
      <Helmet>
        <title>Free College Counselling 2026 – Expert Admission Guidance | StudyCups</title>
        <meta name="description" content="Get free personalized college admission counselling for MBA, B.Tech, MBBS, Law 2026. Expert guidance on college selection, fees, scholarships and application process." />
        <meta name="keywords" content="free college counselling India, admission guidance 2026, MBA counselling, B.Tech admission help, MBBS guidance, college selection India, StudyCups counselling" />
        <link rel="canonical" href="https://studycups.in/free-counselling" />
        <meta name="robots" content="index, follow" />
        <meta property="og:title" content="Free College Counselling 2026 | StudyCups" />
        <meta property="og:description" content="Book free expert counselling for college admissions 2026. MBA, B.Tech, MBBS guidance." />
        <meta property="og:url" content="https://studycups.in/free-counselling" />
        <meta property="og:image" content="https://studycups.in/logos/StudyCups.png" />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Service",
          "name": "Free College Counselling",
          "description": "Free personalized college admission counselling for MBA, B.Tech, MBBS 2026",
          "provider": { "@type": "Organization", "name": "StudyCups", "url": "https://studycups.in" },
          "areaServed": "India",
          "isRelatedTo": ["MBA Admission", "B.Tech Admission", "MBBS Admission"]
        })}</script>
      </Helmet>

      {/* HERO */}
      <section className="relative md:mt-[100px] mt-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#030c1a] via-[#061528] to-[#0b2545]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(14,165,233,0.18)_0%,transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(245,158,11,0.14)_0%,transparent_55%)]" />
        <div className="pointer-events-none absolute top-[-60px] left-[-60px] w-[300px] h-[300px] rounded-full bg-indigo-600/20 blur-[80px]" />
        <div className="pointer-events-none absolute bottom-[-40px] right-[10%] w-[250px] h-[250px] rounded-full bg-amber-400/10 blur-[60px]" />
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "radial-gradient(circle,#fff 1px,transparent 1px)", backgroundSize: "28px 28px" }} />

        <div className="relative max-w-5xl mx-auto px-4 py-7 md:py-10">
          <nav aria-label="breadcrumb" className="mb-3 flex items-center gap-1.5 text-[11px] text-white/50">
            <a href="/" className="hover:text-white transition">Home</a>
            <span>/</span>
            <span className="text-amber-400 font-medium">Free Counselling</span>
          </nav>
          <div className="flex flex-col lg:flex-row gap-8 items-start">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-0.5 mb-3">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-300">100% FREE · EXPERT COUNSELLORS · 5,000+ GUIDED</span>
              </div>
              <h1 className="text-[24px] sm:text-[32px] md:text-[40px] font-extrabold leading-tight text-white mb-3">
                Free{" "}
                <span className="bg-gradient-to-r from-amber-300 via-orange-400 to-amber-500 bg-clip-text text-transparent">College Counselling</span>
              </h1>
              <p className="text-white/65 text-[13px] leading-relaxed max-w-lg mb-5">
                Get <strong className="text-white/90">personalised admission guidance</strong> for MBA, B.Tech, MBBS, Law & more. Our experts help you choose the right college, apply successfully & secure scholarships.
              </p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: "🎓", label: "500+ Colleges", sub: "Across all streams" },
                  { icon: "👨‍💼", label: "Expert Counsellors", sub: "10+ years experience" },
                  { icon: "💰", label: "Scholarships", sub: "Up to ₹1 Lakh" },
                  { icon: "⭐", label: "4.8/5 Rating", sub: "5,000+ students guided" },
                ].map(stat => (
                  <div key={stat.label} className="flex items-center gap-3 bg-white/[0.06] border border-white/10 rounded-xl px-3 py-2.5">
                    <span className="text-xl">{stat.icon}</span>
                    <div>
                      <p className="text-[12px] font-bold text-white">{stat.label}</p>
                      <p className="text-[10px] text-white/50">{stat.sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Quick CTA card */}
            <div className="lg:w-[260px] flex-shrink-0 rounded-2xl border border-white/10 bg-white/[0.06] backdrop-blur-sm p-5">
              <p className="text-[11px] font-bold uppercase tracking-widest text-amber-300/80 mb-3">📞 Call Us Now</p>
              <a href="tel:+918081269969" className="block text-[22px] font-extrabold text-white mb-1">+91 8081269969</a>
              <p className="text-[11px] text-white/50 mb-4">Mon–Sat · 9AM to 8PM</p>
              <div className="space-y-2 text-[11px] text-white/70">
                {["MBA / PGDM Admissions", "B.Tech / NIT / BITS", "MBBS Direct Admission", "Law NLU Guidance", "Scholarship Assistance"].map(item => (
                  <div key={item} className="flex items-center gap-2 border-b border-white/10 pb-1.5">
                    <span className="text-emerald-400">✓</span>{item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="relative w-full overflow-hidden leading-[0] h-6">
          <svg viewBox="0 0 1440 60" preserveAspectRatio="none" className="absolute bottom-0 w-full h-full" fill="#f2f4f7">
            <path d="M0,30 C360,60 1080,0 1440,30 L1440,60 L0,60 Z" />
          </svg>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 py-8 pb-16">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* FORM */}
          <div>
            {submitted ? (
              <div className="bg-white rounded-2xl border border-emerald-200 shadow-sm p-10 text-center">
                <div className="text-5xl mb-4">✅</div>
                <h2 className="text-[22px] font-bold text-slate-900 mb-2">Request Submitted!</h2>
                <p className="text-slate-500 text-[14px] mb-6">Our counsellor will call you within <strong>24 hours</strong>. You can also reach us directly at <strong>+91 8081269969</strong>.</p>
                <div className="flex gap-3 justify-center flex-wrap">
                  <button onClick={() => navigate("/college-predictor")} className="px-5 py-2.5 bg-gradient-to-r from-[#1f4fa8] to-[#0a214a] text-white font-bold rounded-xl text-sm">
                    Try College Predictor →
                  </button>
                  <button onClick={() => navigate("/")} className="px-5 py-2.5 border border-slate-200 text-slate-600 font-semibold rounded-xl text-sm hover:bg-slate-50">
                    Back to Home
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_8px_40px_rgba(10,33,74,0.09)] overflow-hidden">
                <div className="bg-gradient-to-r from-[#0a214a] to-[#1f4fa8] px-6 py-4">
                  <h2 className="text-[17px] font-bold text-white">Book Free Counselling Session</h2>
                  <p className="text-[12px] text-white/60">Fill in your details — our expert will call you within 24 hours</p>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Full Name *</label>
                      <input name="name" value={form.name} onChange={handleChange} required placeholder="Your name" className="w-full h-10 rounded-xl border border-slate-200 px-3 text-[13px] focus:outline-none focus:border-[#1f4fa8] focus:ring-2 focus:ring-[#1f4fa8]/10" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Phone Number *</label>
                      <input name="phone" value={form.phone} onChange={handleChange} required placeholder="+91 98765..." type="tel" className="w-full h-10 rounded-xl border border-slate-200 px-3 text-[13px] focus:outline-none focus:border-[#1f4fa8] focus:ring-2 focus:ring-[#1f4fa8]/10" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Email Address</label>
                    <input name="email" value={form.email} onChange={handleChange} placeholder="you@email.com" type="email" className="w-full h-10 rounded-xl border border-slate-200 px-3 text-[13px] focus:outline-none focus:border-[#1f4fa8]" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Stream Interested In *</label>
                      <select name="stream" value={form.stream} onChange={handleChange} required className="w-full h-10 rounded-xl border border-slate-200 px-3 text-[13px] bg-white focus:outline-none focus:border-[#1f4fa8]">
                        <option value="">Select stream</option>
                        {STREAMS.map(s => <option key={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Annual Fee Budget</label>
                      <select name="budget" value={form.budget} onChange={handleChange} className="w-full h-10 rounded-xl border border-slate-200 px-3 text-[13px] bg-white focus:outline-none focus:border-[#1f4fa8]">
                        <option value="">Select budget</option>
                        {BUDGETS.map(b => <option key={b}>{b}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Preferred Call Timing</label>
                    <select name="timing" value={form.timing} onChange={handleChange} className="w-full h-10 rounded-xl border border-slate-200 px-3 text-[13px] bg-white focus:outline-none focus:border-[#1f4fa8]">
                      <option value="">Select timing</option>
                      {TIMINGS.map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Specific Questions / Requirements</label>
                    <textarea name="message" value={form.message} onChange={handleChange} rows={3} placeholder="e.g. Looking for MBA colleges under 10 LPA in Delhi NCR with good placements..." className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-[13px] focus:outline-none focus:border-[#1f4fa8] resize-none" />
                  </div>
                  <button type="submit" disabled={loading} className="w-full py-3 bg-gradient-to-r from-amber-400 to-orange-500 text-[#0a1628] font-bold rounded-xl text-[14px] shadow hover:opacity-90 transition disabled:opacity-50">
                    {loading ? "Submitting..." : "📞 Book Free Counselling →"}
                  </button>
                  <p className="text-center text-[10px] text-slate-400">By submitting, you agree to be contacted by StudyCups advisors. 100% free, no spam.</p>
                </form>
              </div>
            )}
          </div>

          {/* RIGHT SIDE INFO */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <h3 className="text-[15px] font-bold text-slate-900 mb-4">What Our Counselling Covers</h3>
              <div className="space-y-3">
                {[
                  { icon: "🏛️", title: "College Selection", desc: "Shortlist best-fit colleges based on your score, budget & goals" },
                  { icon: "📝", title: "Application Strategy", desc: "Step-by-step guidance on filling forms and writing SOPs" },
                  { icon: "💰", title: "Scholarship Guidance", desc: "Identify merit & need-based scholarships up to ₹1 Lakh" },
                  { icon: "📅", title: "Deadline Tracking", desc: "Never miss an important application or exam deadline" },
                  { icon: "🤝", title: "Career Alignment", desc: "Match your career goals with the right course and college" },
                ].map(item => (
                  <div key={item.title} className="flex gap-3 items-start py-2.5 border-b border-slate-50 last:border-0">
                    <span className="text-xl flex-shrink-0 mt-0.5">{item.icon}</span>
                    <div>
                      <p className="text-[13px] font-bold text-slate-800">{item.title}</p>
                      <p className="text-[11px] text-slate-500">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-[#0a214a] to-[#1f4fa8] rounded-2xl p-5">
              <p className="text-[11px] font-bold text-amber-300 uppercase tracking-wide mb-3">Student Success Stories</p>
              {[
                { name: "Rahul S.", college: "IIM Lucknow", score: "CAT 94.5%ile", result: "MBA Admitted 2025" },
                { name: "Priya M.", college: "VIT Vellore", score: "JEE 67,000 Rank", result: "B.Tech CS Admitted" },
                { name: "Arjun K.", college: "Manipal Medical", score: "NEET 580", result: "MBBS Admitted 2025" },
              ].map(s => (
                <div key={s.name} className="flex items-center gap-3 border-b border-white/10 py-2.5 last:border-0">
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-[12px] font-bold text-white">{s.name[0]}</div>
                  <div className="flex-1">
                    <p className="text-[12px] font-bold text-white">{s.name} → <span className="text-amber-300">{s.college}</span></p>
                    <p className="text-[10px] text-white/50">{s.score} · {s.result}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button onClick={() => navigate("/college-predictor")} className="flex-1 py-3 bg-white border border-slate-200 text-[#1f4fa8] font-bold rounded-xl text-[12px] shadow-sm hover:shadow-md transition">
                🎯 College Predictor
              </button>
              <button onClick={() => navigate("/ai-college-finder")} className="flex-1 py-3 bg-white border border-slate-200 text-[#1f4fa8] font-bold rounded-xl text-[12px] shadow-sm hover:shadow-md transition">
                🤖 AI Finder
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FreeCounsellingPage;
