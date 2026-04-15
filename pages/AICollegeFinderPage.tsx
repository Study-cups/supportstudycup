import React, { useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";

interface QuizAnswer {
  stream?: string;
  budget?: string;
  location?: string;
  score?: string;
  priority?: string;
}

interface CollegeMatch {
  name: string;
  course: string;
  location: string;
  fees: string;
  type: string;
  match: number;
  reason: string;
}

const STEPS = [
  {
    id: "stream", question: "Which field do you want to study?", key: "stream" as const,
    options: [
      { label: "MBA / Management", value: "MBA", icon: "💼" },
      { label: "B.Tech / Engineering", value: "Engineering", icon: "⚙️" },
      { label: "MBBS / Medical", value: "Medical", icon: "🏥" },
      { label: "Law (LLB)", value: "Law", icon: "⚖️" },
      { label: "Design / Arts", value: "Design", icon: "🎨" },
      { label: "Commerce / BBA", value: "Commerce", icon: "📊" },
    ]
  },
  {
    id: "budget", question: "What is your annual fee budget?", key: "budget" as const,
    options: [
      { label: "Under ₹2 Lakh/yr", value: "low", icon: "💚" },
      { label: "₹2L – ₹5L/yr", value: "medium", icon: "💛" },
      { label: "₹5L – ₹15L/yr", value: "high", icon: "🟠" },
      { label: "Above ₹15L/yr", value: "premium", icon: "💎" },
    ]
  },
  {
    id: "location", question: "Where do you prefer to study?", key: "location" as const,
    options: [
      { label: "Delhi NCR", value: "Delhi", icon: "🏙️" },
      { label: "Mumbai / Pune", value: "Mumbai", icon: "🌊" },
      { label: "Bangalore", value: "Bangalore", icon: "🌿" },
      { label: "Chennai / Hyderabad", value: "South", icon: "🌴" },
      { label: "Any City", value: "Any", icon: "🗺️" },
    ]
  },
  {
    id: "priority", question: "What matters most to you?", key: "priority" as const,
    options: [
      { label: "Best Placements", value: "placement", icon: "💰" },
      { label: "Government College", value: "government", icon: "🏛️" },
      { label: "Brand / Reputation", value: "brand", icon: "🏆" },
      { label: "Low Fees", value: "fees", icon: "💵" },
      { label: "Research Opportunities", value: "research", icon: "🔬" },
    ]
  },
];

const COLLEGE_DATABASE: CollegeMatch[] = [
  { name: "IIM Ahmedabad", course: "MBA", location: "Ahmedabad", fees: "₹23 L/yr", type: "Government", match: 98, reason: "Top NIRF rank, highest placements" },
  { name: "IIM Bangalore", course: "MBA", location: "Bangalore", fees: "₹23 L/yr", type: "Government", match: 96, reason: "Excellent research & global exposure" },
  { name: "IIT Delhi", course: "B.Tech CSE", location: "Delhi", fees: "₹2.5 L/yr", type: "Government", match: 97, reason: "Top engineering + research hub" },
  { name: "IIT Bombay", course: "B.Tech CS", location: "Mumbai", fees: "₹2.5 L/yr", type: "Government", match: 95, reason: "Industry connections, top placements" },
  { name: "AIIMS Delhi", course: "MBBS", location: "Delhi", fees: "₹10K/yr", type: "Government", match: 99, reason: "Best medical college in India" },
  { name: "NLSIU Bangalore", course: "BA LLB", location: "Bangalore", fees: "₹2.4 L/yr", type: "Government", match: 98, reason: "Top NLU, best law placement" },
  { name: "MDI Gurgaon", course: "PGDM", location: "Delhi", fees: "₹19 L/yr", type: "Private", match: 85, reason: "Strong brand, Delhi NCR location" },
  { name: "XLRI Jamshedpur", course: "MBA", location: "Jamshedpur", fees: "₹24 L/yr", type: "Private", match: 88, reason: "Best HR + BM programme in India" },
  { name: "NIT Trichy", course: "B.Tech CS", location: "Trichy", fees: "₹1.5 L/yr", type: "Government", match: 82, reason: "Top NIT, affordable, great placement" },
  { name: "BITS Pilani", course: "B.Tech CS", location: "Pilani", fees: "₹5.5 L/yr", type: "Deemed", match: 84, reason: "No entrance exam, industry-oriented" },
  { name: "VIT Vellore", course: "B.Tech CS", location: "Chennai", fees: "₹3.5 L/yr", type: "Deemed", match: 75, reason: "Good placement, flexible credits" },
  { name: "Manipal Medical", course: "MBBS", location: "Manipal", fees: "₹20 L/yr", type: "Deemed", match: 72, reason: "Top private medical college" },
  { name: "SP Jain Mumbai", course: "PGDM", location: "Mumbai", fees: "₹18 L/yr", type: "Private", match: 80, reason: "Mumbai location, top B-school" },
  { name: "IMT Ghaziabad", course: "PGDM", location: "Delhi", fees: "₹14 L/yr", type: "Private", match: 72, reason: "Good Delhi NCR B-school, affordable" },
  { name: "Great Lakes Chennai", course: "PGPM", location: "Chennai", fees: "₹16 L/yr", type: "Private", match: 74, reason: "South India MBA, exec focus" },
  { name: "FORE School Delhi", course: "PGDM", location: "Delhi", fees: "₹12 L/yr", type: "Private", match: 70, reason: "Affordable Delhi MBA option" },
  { name: "Symbiosis Law Pune", course: "BA LLB", location: "Mumbai", fees: "₹3.5 L/yr", type: "Private", match: 78, reason: "Top private law college" },
  { name: "Pearl Academy Delhi", course: "B.Des", location: "Delhi", fees: "₹5 L/yr", type: "Private", match: 82, reason: "Top design school, strong placements" },
  { name: "NIFT Delhi", course: "B.Des Fashion", location: "Delhi", fees: "₹1.8 L/yr", type: "Government", match: 90, reason: "Premier fashion design institute" },
  { name: "Christ University", course: "BBA", location: "Bangalore", fees: "₹2.5 L/yr", type: "Deemed", match: 76, reason: "Strong commerce, South India" },
];

const getMatches = (answers: QuizAnswer): CollegeMatch[] => {
  const { stream, budget, location, priority } = answers;

  const streamMap: Record<string, string[]> = {
    MBA: ["MBA", "PGDM", "PGPM", "BM", "HRM"],
    Engineering: ["B.Tech", "BE"],
    Medical: ["MBBS", "Medical"],
    Law: ["LLB", "Law"],
    Design: ["Design", "Fashion"],
    Commerce: ["BBA", "Commerce"],
  };

  const budgetMap: Record<string, [number, number]> = {
    low: [0, 200000],
    medium: [200001, 500000],
    high: [500001, 1500000],
    premium: [1500001, Infinity],
  };

  const feeToNumber = (fee: string) => {
    const num = parseFloat(fee.replace(/[^0-9.]/g, ""));
    if (fee.includes("L")) return num * 100000;
    if (fee.includes("K")) return num * 1000;
    return num;
  };

  let results = COLLEGE_DATABASE.filter(c => {
    const streamCourses = stream ? streamMap[stream] || [] : [];
    const matchesStream = streamCourses.length === 0 || streamCourses.some(s => c.course.includes(s));

    const feeNum = feeToNumber(c.fees);
    const [minBudget, maxBudget] = budget ? budgetMap[budget] : [0, Infinity];
    const matchesBudget = feeNum >= minBudget && feeNum <= maxBudget;

    const matchesLocation = !location || location === "Any" ||
      c.location.toLowerCase().includes(location.toLowerCase()) ||
      (location === "South" && (c.location.includes("Chennai") || c.location.includes("Hyderabad") || c.location.includes("Bangalore") || c.location.includes("Trichy") || c.location.includes("Mysore") || c.location.includes("Manipal")));

    return matchesStream && matchesBudget && matchesLocation;
  });

  // Adjust match score based on priority
  if (priority === "government") results = results.filter(c => c.type === "Government");
  if (priority === "fees") results = results.sort((a, b) => feeToNumber(a.fees) - feeToNumber(b.fees));
  if (priority === "placement" || priority === "brand") results = results.sort((a, b) => b.match - a.match);

  return results.slice(0, 6);
};

const AICollegeFinderPage: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswer>({});
  const [completed, setCompleted] = useState(false);
  const [results, setResults] = useState<CollegeMatch[]>([]);

  const handleSelect = (key: keyof QuizAnswer, value: string) => {
    const newAnswers = { ...answers, [key]: value };
    setAnswers(newAnswers);

    setTimeout(() => {
      if (currentStep < STEPS.length - 1) {
        setCurrentStep(prev => prev + 1);
      } else {
        setResults(getMatches(newAnswers));
        setCompleted(true);
      }
    }, 300);
  };

  const handleReset = () => {
    setAnswers({});
    setCurrentStep(0);
    setCompleted(false);
    setResults([]);
  };

  const step = STEPS[currentStep];
  const progress = ((currentStep) / STEPS.length) * 100;

  return (
    <div className="min-h-screen bg-[#f2f4f7]">
      <Helmet>
        <title>AI College Finder 2026 – Find Your Perfect College | StudyCups</title>
        <meta name="description" content="Use StudyCups AI College Finder to get personalized college recommendations based on your stream, budget, location and career goals. Find the perfect college in 2026." />
        <meta name="keywords" content="AI college finder India, personalised college recommendation, best college for me 2026, college shortlist tool, StudyCups AI finder" />
        <link rel="canonical" href="https://studycups.in/ai-college-finder" />
        <meta name="robots" content="index, follow" />
        <meta property="og:title" content="AI College Finder 2026 | StudyCups" />
        <meta property="og:description" content="Get AI-powered college recommendations in 4 quick questions." />
        <meta property="og:url" content="https://studycups.in/ai-college-finder" />
        <meta property="og:image" content="https://studycups.in/logos/StudyCups.png" />
      </Helmet>

      {/* HERO */}
      <section className="relative md:mt-[100px] mt-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#030c1a] via-[#061528] to-[#0b2545]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(14,165,233,0.18)_0%,transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(245,158,11,0.14)_0%,transparent_55%)]" />
        <div className="pointer-events-none absolute top-[-60px] left-[-60px] w-[300px] h-[300px] rounded-full bg-indigo-600/20 blur-[80px]" />
        <div className="pointer-events-none absolute bottom-[-40px] right-[10%] w-[250px] h-[250px] rounded-full bg-amber-400/10 blur-[60px]" />
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "radial-gradient(circle,#fff 1px,transparent 1px)", backgroundSize: "28px 28px" }} />

        <div className="relative max-w-3xl mx-auto px-4 py-7 md:py-10 text-center">
          <nav aria-label="breadcrumb" className="mb-3 flex items-center justify-center gap-1.5 text-[11px] text-white/50">
            <a href="/" className="hover:text-white transition">Home</a>
            <span>/</span>
            <span className="text-amber-400 font-medium">AI College Finder</span>
          </nav>
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-0.5 mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-amber-300">AI POWERED · PERSONALISED · FREE TOOL</span>
          </div>
          <h1 className="text-[26px] sm:text-[34px] md:text-[42px] font-extrabold leading-tight text-white mb-3">
            <span className="bg-gradient-to-r from-amber-300 via-orange-400 to-amber-500 bg-clip-text text-transparent">AI College</span> Finder 2026
          </h1>
          <p className="text-white/65 text-[13px] md:text-[15px] leading-relaxed max-w-xl mx-auto">
            Answer <strong className="text-white/90">4 quick questions</strong> and get personalised college recommendations matched to your stream, budget and goals.
          </p>
        </div>
        <div className="relative w-full overflow-hidden leading-[0] h-6">
          <svg viewBox="0 0 1440 60" preserveAspectRatio="none" className="absolute bottom-0 w-full h-full" fill="#f2f4f7">
            <path d="M0,30 C360,60 1080,0 1440,30 L1440,60 L0,60 Z" />
          </svg>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-4 py-8 pb-16">
        {!completed ? (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_8px_40px_rgba(10,33,74,0.09)] p-6 md:p-8">
            {/* Progress */}
            <div className="mb-6">
              <div className="flex justify-between text-[11px] text-slate-500 mb-2">
                <span>Question {currentStep + 1} of {STEPS.length}</span>
                <span>{Math.round(progress)}% Complete</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[#1f4fa8] to-amber-400 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
              </div>
            </div>

            <h2 className="text-[20px] md:text-[24px] font-bold text-slate-900 mb-6 text-center">{step.question}</h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {step.options.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => handleSelect(step.key, opt.value)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 text-center transition-all duration-200 hover:border-[#1f4fa8] hover:shadow-md group ${
                    answers[step.key] === opt.value
                      ? "border-[#1f4fa8] bg-blue-50 shadow-md"
                      : "border-slate-200 bg-white hover:bg-blue-50/50"
                  }`}
                >
                  <span className="text-3xl">{opt.icon}</span>
                  <span className="text-[12px] font-semibold text-slate-700 group-hover:text-[#1f4fa8]">{opt.label}</span>
                </button>
              ))}
            </div>

            {currentStep > 0 && (
              <button onClick={() => setCurrentStep(prev => prev - 1)} className="mt-6 text-sm text-slate-500 hover:text-slate-700 transition">
                ← Back
              </button>
            )}
          </div>
        ) : (
          <div>
            <div className="mb-5">
              <div className="h-1 w-8 bg-gradient-to-r from-[#1f4fa8] to-amber-400 rounded mb-2" />
              <h2 className="text-[20px] font-extrabold text-slate-800">
                {results.length > 0 ? `🎯 ${results.length} Colleges Matched for You` : "No Exact Matches Found"}
              </h2>
              <p className="text-[12px] text-slate-500 mt-1">
                Based on: {answers.stream} · {answers.budget} budget · {answers.location} · Priority: {answers.priority}
              </p>
            </div>

            {results.length === 0 ? (
              <div className="bg-white rounded-2xl p-10 text-center border border-slate-100">
                <div className="text-4xl mb-3">🔍</div>
                <h3 className="text-[17px] font-bold text-slate-800 mb-2">No Exact Matches</h3>
                <p className="text-[13px] text-slate-500 mb-5">Try adjusting your budget or location preference for more results.</p>
                <button onClick={handleReset} className="px-6 py-2.5 bg-gradient-to-r from-amber-400 to-orange-500 text-[#0a1628] font-bold rounded-xl text-sm">
                  Try Again
                </button>
              </div>
            ) : (
              <div className="grid gap-4">
                {results.map((college, idx) => (
                  <div key={idx} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-[#1f4fa8]/10 to-[#0a214a]/20 flex items-center justify-center text-2xl">🏛️</div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div>
                          <h3 className="text-[15px] font-bold text-slate-900">{college.name}</h3>
                          <p className="text-[11px] text-slate-500">{college.course} · {college.location} · {college.type}</p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="h-2 w-16 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full" style={{ width: `${college.match}%` }} />
                          </div>
                          <span className="text-[12px] font-bold text-emerald-600">{college.match}%</span>
                        </div>
                      </div>
                      <div className="flex gap-4 mt-2">
                        <span className="text-[11px] text-slate-600">💰 {college.fees}</span>
                        <span className="text-[11px] text-slate-500 italic">"{college.reason}"</span>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button onClick={() => navigate("/colleges")} className="px-3 py-1.5 bg-gradient-to-r from-[#1f4fa8] to-[#0a214a] text-white rounded-lg text-[11px] font-bold">
                        View →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-3 mt-6 flex-wrap">
              <button onClick={handleReset} className="px-5 py-2.5 border border-slate-200 text-slate-600 font-semibold rounded-xl text-sm hover:bg-slate-50 transition">
                🔄 Start Over
              </button>
              <button onClick={() => navigate("/college-predictor")} className="px-5 py-2.5 bg-gradient-to-r from-[#1f4fa8] to-[#0a214a] text-white font-bold rounded-xl text-sm">
                🎯 Score Predictor →
              </button>
              <button onClick={() => navigate("/free-counselling")} className="px-5 py-2.5 bg-gradient-to-r from-amber-400 to-orange-500 text-[#0a1628] font-bold rounded-xl text-sm">
                📞 Free Counselling →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AICollegeFinderPage;
