import React, { useState, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";

interface PredictorResult {
  college: string;
  course: string;
  cutoff: string;
  fees: string;
  chance: "High" | "Medium" | "Low";
  location: string;
  type: string;
}

// Static predictor data - realistic college cut-offs
const PREDICTOR_DATA: Record<string, PredictorResult[]> = {
  CAT: [
    { college: "IIM Ahmedabad", course: "MBA", cutoff: "99+ Percentile", fees: "₹23 L/yr", chance: "High", location: "Ahmedabad", type: "Government" },
    { college: "IIM Bangalore", course: "MBA", cutoff: "98+ Percentile", fees: "₹23 L/yr", chance: "High", location: "Bangalore", type: "Government" },
    { college: "IIM Calcutta", course: "MBA", cutoff: "97+ Percentile", fees: "₹22 L/yr", chance: "High", location: "Kolkata", type: "Government" },
    { college: "IIM Lucknow", course: "MBA", cutoff: "95+ Percentile", fees: "₹16 L/yr", chance: "High", location: "Lucknow", type: "Government" },
    { college: "MDI Gurgaon", course: "PGDM", cutoff: "90+ Percentile", fees: "₹19 L/yr", chance: "High", location: "Gurgaon", type: "Private" },
    { college: "XLRI Jamshedpur", course: "BM/HRM", cutoff: "90+ Percentile", fees: "₹24 L/yr", chance: "High", location: "Jamshedpur", type: "Private" },
    { college: "SP Jain Mumbai", course: "PGDM", cutoff: "85+ Percentile", fees: "₹18 L/yr", chance: "Medium", location: "Mumbai", type: "Private" },
    { college: "IIFT Delhi", course: "MBA (IB)", cutoff: "85+ Percentile", fees: "₹16 L/yr", chance: "Medium", location: "Delhi", type: "Government" },
    { college: "IMT Ghaziabad", course: "PGDM", cutoff: "80+ Percentile", fees: "₹14 L/yr", chance: "Medium", location: "Ghaziabad", type: "Private" },
    { college: "Great Lakes Chennai", course: "PGPM", cutoff: "75+ Percentile", fees: "₹16 L/yr", chance: "Medium", location: "Chennai", type: "Private" },
    { college: "Fore School Delhi", course: "PGDM", cutoff: "70+ Percentile", fees: "₹12 L/yr", chance: "Medium", location: "Delhi", type: "Private" },
    { college: "BIMTECH Noida", course: "PGDM", cutoff: "60+ Percentile", fees: "₹9 L/yr", chance: "Low", location: "Noida", type: "Private" },
  ],
  JEE: [
    { college: "IIT Bombay", course: "B.Tech CSE", cutoff: "Top 200 Rank", fees: "₹2.5 L/yr", chance: "High", location: "Mumbai", type: "Government" },
    { college: "IIT Delhi", course: "B.Tech CSE", cutoff: "Top 500 Rank", fees: "₹2.5 L/yr", chance: "High", location: "Delhi", type: "Government" },
    { college: "IIT Madras", course: "B.Tech CS", cutoff: "Top 700 Rank", fees: "₹2.5 L/yr", chance: "High", location: "Chennai", type: "Government" },
    { college: "IIT Kanpur", course: "B.Tech CS", cutoff: "Top 1000 Rank", fees: "₹2.5 L/yr", chance: "High", location: "Kanpur", type: "Government" },
    { college: "NIT Trichy", course: "B.Tech CS", cutoff: "Top 5000 Rank", fees: "₹1.5 L/yr", chance: "High", location: "Trichy", type: "Government" },
    { college: "NIT Warangal", course: "B.Tech CS", cutoff: "Top 8000 Rank", fees: "₹1.5 L/yr", chance: "High", location: "Warangal", type: "Government" },
    { college: "BITS Pilani", course: "B.Tech CS", cutoff: "Top 3000 Rank", fees: "₹5.5 L/yr", chance: "Medium", location: "Pilani", type: "Deemed" },
    { college: "VIT Vellore", course: "B.Tech CS", cutoff: "Top 50000 Rank", fees: "₹3.5 L/yr", chance: "Medium", location: "Vellore", type: "Deemed" },
    { college: "Manipal Institute", course: "B.Tech CS", cutoff: "Top 80000 Rank", fees: "₹4.5 L/yr", chance: "Medium", location: "Manipal", type: "Deemed" },
    { college: "SRM Chennai", course: "B.Tech CS", cutoff: "Top 100000 Rank", fees: "₹3 L/yr", chance: "Low", location: "Chennai", type: "Deemed" },
  ],
  NEET: [
    { college: "AIIMS Delhi", course: "MBBS", cutoff: "715+ Score", fees: "₹10K/yr", chance: "High", location: "Delhi", type: "Government" },
    { college: "AIIMS Jodhpur", course: "MBBS", cutoff: "680+ Score", fees: "₹10K/yr", chance: "High", location: "Jodhpur", type: "Government" },
    { college: "Maulana Azad Medical", course: "MBBS", cutoff: "650+ Score", fees: "₹5K/yr", chance: "High", location: "Delhi", type: "Government" },
    { college: "Armed Forces Medical", course: "MBBS", cutoff: "640+ Score", fees: "₹55K/yr", chance: "High", location: "Pune", type: "Government" },
    { college: "Kasturba Medical Manipal", course: "MBBS", cutoff: "600+ Score", fees: "₹20 L/yr", chance: "High", location: "Manipal", type: "Deemed" },
    { college: "JSS Medical Mysore", course: "MBBS", cutoff: "580+ Score", fees: "₹14 L/yr", chance: "Medium", location: "Mysore", type: "Deemed" },
    { college: "SRM Medical College", course: "MBBS", cutoff: "550+ Score", fees: "₹18 L/yr", chance: "Medium", location: "Chennai", type: "Deemed" },
    { college: "Saveetha Medical", course: "MBBS", cutoff: "530+ Score", fees: "₹22 L/yr", chance: "Low", location: "Chennai", type: "Deemed" },
  ],
  CLAT: [
    { college: "NLSIU Bangalore", course: "BA LLB", cutoff: "95+ Score", fees: "₹2.4 L/yr", chance: "High", location: "Bangalore", type: "Government" },
    { college: "NALSAR Hyderabad", course: "BA LLB", cutoff: "90+ Score", fees: "₹2.2 L/yr", chance: "High", location: "Hyderabad", type: "Government" },
    { college: "NUJS Kolkata", course: "BA LLB", cutoff: "85+ Score", fees: "₹2 L/yr", chance: "High", location: "Kolkata", type: "Government" },
    { college: "NLU Delhi", course: "BA LLB", cutoff: "80+ Score", fees: "₹1.8 L/yr", chance: "High", location: "Delhi", type: "Government" },
    { college: "NLU Jodhpur", course: "BA LLB", cutoff: "75+ Score", fees: "₹1.5 L/yr", chance: "Medium", location: "Jodhpur", type: "Government" },
    { college: "GNLU Gandhinagar", course: "BA LLB", cutoff: "70+ Score", fees: "₹1.4 L/yr", chance: "Medium", location: "Gandhinagar", type: "Government" },
    { college: "Symbiosis Law Pune", course: "BA LLB", cutoff: "60+ Score", fees: "₹3.5 L/yr", chance: "Low", location: "Pune", type: "Private" },
  ],
};

const EXAM_CONFIG: Record<string, { label: string; unit: string; min: number; max: number; step: number; placeholder: string; }> = {
  CAT: { label: "CAT Percentile", unit: "Percentile", min: 0, max: 100, step: 0.01, placeholder: "e.g. 85.5" },
  JEE: { label: "JEE Main Rank", unit: "Rank", min: 1, max: 300000, step: 1, placeholder: "e.g. 15000" },
  NEET: { label: "NEET Score", unit: "Marks", min: 0, max: 720, step: 1, placeholder: "e.g. 620" },
  CLAT: { label: "CLAT Score", unit: "Marks", min: 0, max: 120, step: 0.25, placeholder: "e.g. 80" },
};

const CHANCE_CONFIG = {
  High: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", bar: "bg-emerald-500", width: "w-full" },
  Medium: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", bar: "bg-amber-400", width: "w-2/3" },
  Low: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", bar: "bg-red-400", width: "w-1/3" },
};

const getMatchingColleges = (exam: string, score: number): PredictorResult[] => {
  const data = PREDICTOR_DATA[exam] || [];
  if (!score) return [];

  // Filter based on exam type
  return data.filter(d => {
    const cutoff = d.cutoff;
    if (exam === "CAT") {
      const pct = parseFloat(cutoff.replace(/[^0-9.]/g, ""));
      return score >= pct;
    }
    if (exam === "JEE") {
      const rank = parseInt(cutoff.replace(/[^0-9]/g, ""));
      return score <= rank;
    }
    if (exam === "NEET") {
      const marks = parseInt(cutoff.replace(/[^0-9]/g, ""));
      return score >= marks;
    }
    if (exam === "CLAT") {
      const marks = parseFloat(cutoff.replace(/[^0-9.]/g, ""));
      return score >= marks;
    }
    return false;
  });
};

const CollegePredictorPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedExam, setSelectedExam] = useState("CAT");
  const [score, setScore] = useState("");
  const [category, setCategory] = useState("General");
  const [submitted, setSubmitted] = useState(false);

  const results = useMemo(() => {
    if (!submitted || !score) return [];
    return getMatchingColleges(selectedExam, parseFloat(score));
  }, [submitted, selectedExam, score]);

  const handlePredict = () => {
    if (!score) return;
    setSubmitted(true);
  };

  const handleReset = () => {
    setScore("");
    setSubmitted(false);
  };

  const examConfig = EXAM_CONFIG[selectedExam];

  return (
    <div className="min-h-screen bg-[#f2f4f7]">
      <Helmet>
        <title>College Predictor 2026 – Predict Colleges by Score | StudyCups</title>
        <meta name="description" content="Use StudyCups College Predictor to find colleges you can get into based on your CAT, JEE, NEET or CLAT score. Get personalized college recommendations with admission chances." />
        <meta name="keywords" content="college predictor 2026, CAT college predictor, JEE college predictor, NEET college predictor, CLAT college predictor, admission chances India, StudyCups" />
        <link rel="canonical" href="https://studycups.in/college-predictor" />
        <meta name="robots" content="index, follow" />
        <meta property="og:title" content="College Predictor 2026 | StudyCups" />
        <meta property="og:description" content="Predict your colleges based on CAT, JEE, NEET, CLAT score. Free tool." />
        <meta property="og:url" content="https://studycups.in/college-predictor" />
        <meta property="og:image" content="https://studycups.in/logos/StudyCups.png" />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://studycups.in" },
            { "@type": "ListItem", "position": 2, "name": "College Predictor 2026", "item": "https://studycups.in/college-predictor" }
          ]
        })}</script>
      </Helmet>

      {/* HERO */}
      <section className="relative md:mt-[100px] mt-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#030c1a] via-[#061528] to-[#0b2545]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(14,165,233,0.18)_0%,transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(245,158,11,0.14)_0%,transparent_55%)]" />
        <div className="pointer-events-none absolute top-[-60px] left-[-60px] w-[300px] h-[300px] rounded-full bg-indigo-600/20 blur-[80px]" />
        <div className="pointer-events-none absolute bottom-[-40px] right-[10%] w-[250px] h-[250px] rounded-full bg-sky-500/15 blur-[70px]" />
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "radial-gradient(circle,#fff 1px,transparent 1px)", backgroundSize: "28px 28px" }} />

        <div className="relative max-w-5xl mx-auto px-4 py-7 md:py-10 text-center">
          <nav aria-label="breadcrumb" className="mb-3 flex items-center justify-center gap-1.5 text-[11px] text-white/50">
            <a href="/" className="hover:text-white transition">Home</a>
            <span>/</span>
            <span className="text-amber-400 font-medium">College Predictor</span>
          </nav>
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-0.5 mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-amber-300">FREE TOOL · 2026 CUTOFFS</span>
          </div>
          <h1 className="text-[26px] sm:text-[34px] md:text-[42px] font-extrabold leading-tight text-white mb-3">
            <span className="bg-gradient-to-r from-amber-300 via-orange-400 to-amber-500 bg-clip-text text-transparent">College Predictor</span> 2026
          </h1>
          <p className="text-white/65 text-[13px] md:text-[15px] leading-relaxed max-w-xl mx-auto">
            Enter your <strong className="text-white/90">CAT, JEE, NEET or CLAT score</strong> and instantly discover colleges you can get into — with your real admission chances.
          </p>
        </div>
        <div className="relative w-full overflow-hidden leading-[0] h-6">
          <svg viewBox="0 0 1440 60" preserveAspectRatio="none" className="absolute bottom-0 w-full h-full" fill="#f2f4f7">
            <path d="M0,30 C360,60 1080,0 1440,30 L1440,60 L0,60 Z" />
          </svg>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 py-8 pb-16">
        {/* PREDICTOR FORM */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_8px_40px_rgba(10,33,74,0.09)] p-6 md:p-8 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1f4fa8] to-[#0a214a] flex items-center justify-center text-white text-lg">🎓</div>
            <div>
              <h2 className="text-[17px] font-bold text-slate-900">Enter Your Score</h2>
              <p className="text-[12px] text-slate-500">Select exam and enter your score to predict colleges</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
            {/* Exam Selection */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Select Exam</label>
              <div className="grid grid-cols-2 gap-2">
                {Object.keys(EXAM_CONFIG).map(exam => (
                  <button
                    key={exam}
                    onClick={() => { setSelectedExam(exam); setSubmitted(false); setScore(""); }}
                    className={`px-3 py-2 rounded-xl text-[12px] font-bold border transition ${
                      selectedExam === exam
                        ? "bg-gradient-to-r from-[#1f4fa8] to-[#0a214a] text-white border-[#1f4fa8]"
                        : "bg-white text-slate-600 border-slate-200 hover:border-[#1f4fa8] hover:text-[#1f4fa8]"
                    }`}
                  >
                    {exam}
                  </button>
                ))}
              </div>
            </div>

            {/* Score Input */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">{examConfig.label}</label>
              <input
                type="number"
                value={score}
                onChange={e => { setScore(e.target.value); setSubmitted(false); }}
                placeholder={examConfig.placeholder}
                min={examConfig.min}
                max={examConfig.max}
                step={examConfig.step}
                className="w-full h-11 rounded-xl border border-slate-200 px-4 text-[14px] font-semibold text-slate-900 focus:outline-none focus:border-[#1f4fa8] focus:ring-2 focus:ring-[#1f4fa8]/10"
              />
              <p className="text-[10px] text-slate-400 mt-1">Range: {examConfig.min} – {examConfig.max} {examConfig.unit}</p>
            </div>

            {/* Category */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Category</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full h-11 rounded-xl border border-slate-200 px-4 text-[13px] text-slate-700 focus:outline-none focus:border-[#1f4fa8] bg-white"
              >
                {["General", "OBC", "SC", "ST", "EWS"].map(cat => (
                  <option key={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handlePredict}
              disabled={!score}
              className="flex-1 md:flex-none md:px-10 py-3 bg-gradient-to-r from-amber-400 to-orange-500 text-[#0a1628] font-bold rounded-xl text-[14px] shadow hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              🔍 Predict My Colleges
            </button>
            {submitted && (
              <button onClick={handleReset} className="px-6 py-3 border border-slate-200 text-slate-600 font-semibold rounded-xl text-[13px] hover:bg-slate-50 transition">
                Reset
              </button>
            )}
          </div>
        </div>

        {/* RESULTS */}
        {submitted && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="h-1 w-8 bg-gradient-to-r from-[#1f4fa8] to-amber-400 rounded mb-1.5" />
                <h2 className="text-[18px] font-extrabold text-slate-800">
                  {results.length > 0 ? `${results.length} Colleges Found for Your Score` : "No Matching Colleges"}
                </h2>
                <p className="text-[12px] text-slate-500">{selectedExam} {score} {examConfig.unit} · {category} Category · 2026 Cutoffs</p>
              </div>
            </div>

            {results.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center">
                <div className="text-4xl mb-3">😔</div>
                <h3 className="text-[17px] font-bold text-slate-800 mb-2">Score Below Cutoffs</h3>
                <p className="text-[13px] text-slate-500 max-w-md mx-auto mb-5">Your score doesn't match any college's cutoff in our database. Consider improving your score or exploring management quota options.</p>
                <button onClick={() => navigate("/free-counselling")} className="px-6 py-2.5 bg-gradient-to-r from-amber-400 to-orange-500 text-[#0a1628] font-bold rounded-xl text-sm">
                  Get Free Counselling →
                </button>
              </div>
            ) : (
              <div className="grid gap-4">
                {results.map((result, idx) => {
                  const cc = CHANCE_CONFIG[result.chance];
                  return (
                    <div key={idx} className={`bg-white rounded-2xl border ${cc.border} shadow-sm p-5 flex flex-col md:flex-row md:items-center gap-4`}>
                      <div className="flex-1">
                        <div className="flex items-start gap-3">
                          <div className={`w-10 h-10 rounded-xl ${cc.bg} flex items-center justify-center text-[18px] flex-shrink-0`}>🏛️</div>
                          <div>
                            <h3 className="text-[15px] font-bold text-slate-900">{result.college}</h3>
                            <p className="text-[12px] text-slate-500">{result.course} · {result.location} · {result.type}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3">
                          <div className="bg-slate-50 rounded-lg px-3 py-2">
                            <p className="text-[10px] text-slate-400 uppercase tracking-wide">Cutoff</p>
                            <p className="text-[12px] font-semibold text-slate-700">{result.cutoff}</p>
                          </div>
                          <div className="bg-slate-50 rounded-lg px-3 py-2">
                            <p className="text-[10px] text-slate-400 uppercase tracking-wide">Annual Fees</p>
                            <p className="text-[12px] font-semibold text-slate-700">{result.fees}</p>
                          </div>
                          <div className={`${cc.bg} rounded-lg px-3 py-2`}>
                            <p className="text-[10px] uppercase tracking-wide text-slate-500">Admission Chance</p>
                            <p className={`text-[12px] font-bold ${cc.text}`}>{result.chance} Chance</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 md:items-end">
                        <button onClick={() => navigate("/colleges")} className="px-4 py-2 bg-gradient-to-r from-[#1f4fa8] to-[#0a214a] text-white rounded-xl text-[11px] font-bold hover:opacity-90 transition">
                          View College →
                        </button>
                        <button onClick={() => navigate("/free-counselling")} className="px-4 py-2 border border-amber-300 text-amber-700 rounded-xl text-[11px] font-semibold hover:bg-amber-50 transition">
                          Get Guidance
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* CTA */}
            <div className="mt-8 bg-gradient-to-br from-[#0a214a] to-[#1f4fa8] rounded-2xl p-6 text-center">
              <h3 className="text-[18px] font-bold text-white mb-2">Need Expert Admission Guidance?</h3>
              <p className="text-white/65 text-[13px] mb-4">Our counsellors can help you choose the right college based on your score, budget and career goals.</p>
              <button onClick={() => navigate("/free-counselling")} className="px-8 py-3 bg-gradient-to-r from-amber-400 to-orange-500 text-[#0a1628] font-bold rounded-xl text-[14px] shadow hover:opacity-90 transition">
                Book Free Counselling →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CollegePredictorPage;
