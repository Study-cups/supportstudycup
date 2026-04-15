import React, { useState, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";

const NIRF_DATA = [
  // Engineering
  { rank: 1, name: "IIT Madras", category: "Engineering", location: "Chennai, TN", score: "90.14", established: 1959, type: "Government", fees: "₹2.5 L/yr", package: "₹21 LPA" },
  { rank: 2, name: "IIT Delhi", category: "Engineering", location: "Delhi", score: "88.12", established: 1961, type: "Government", fees: "₹2.5 L/yr", package: "₹19 LPA" },
  { rank: 3, name: "IIT Bombay", category: "Engineering", location: "Mumbai, MH", score: "83.96", established: 1958, type: "Government", fees: "₹2.5 L/yr", package: "₹22 LPA" },
  { rank: 4, name: "IIT Kanpur", category: "Engineering", location: "Kanpur, UP", score: "82.09", established: 1959, type: "Government", fees: "₹2.5 L/yr", package: "₹18 LPA" },
  { rank: 5, name: "IIT Kharagpur", category: "Engineering", location: "Kharagpur, WB", score: "78.89", established: 1951, type: "Government", fees: "₹2.5 L/yr", package: "₹17 LPA" },
  { rank: 6, name: "IIT Roorkee", category: "Engineering", location: "Roorkee, UK", score: "71.24", established: 1847, type: "Government", fees: "₹2.5 L/yr", package: "₹16 LPA" },
  { rank: 7, name: "IIT Guwahati", category: "Engineering", location: "Guwahati, AS", score: "68.42", established: 1994, type: "Government", fees: "₹2.5 L/yr", package: "₹15 LPA" },
  { rank: 8, name: "NIT Trichy", category: "Engineering", location: "Trichy, TN", score: "61.29", established: 1964, type: "Government", fees: "₹1.5 L/yr", package: "₹12 LPA" },
  { rank: 9, name: "BITS Pilani", category: "Engineering", location: "Pilani, RJ", score: "60.11", established: 1964, type: "Deemed", fees: "₹5.5 L/yr", package: "₹14 LPA" },
  { rank: 10, name: "NIT Warangal", category: "Engineering", location: "Warangal, TS", score: "58.92", established: 1959, type: "Government", fees: "₹1.5 L/yr", package: "₹11 LPA" },
  // Management
  { rank: 1, name: "IIM Ahmedabad", category: "Management", location: "Ahmedabad, GJ", score: "82.20", established: 1961, type: "Government", fees: "₹23 L/yr", package: "₹32 LPA" },
  { rank: 2, name: "IIM Bangalore", category: "Management", location: "Bangalore, KA", score: "81.06", established: 1973, type: "Government", fees: "₹23 L/yr", package: "₹31 LPA" },
  { rank: 3, name: "IIM Calcutta", category: "Management", location: "Kolkata, WB", score: "79.68", established: 1961, type: "Government", fees: "₹22 L/yr", package: "₹30 LPA" },
  { rank: 4, name: "IIM Lucknow", category: "Management", location: "Lucknow, UP", score: "75.34", established: 1984, type: "Government", fees: "₹16 L/yr", package: "₹25 LPA" },
  { rank: 5, name: "IIM Kozhikode", category: "Management", location: "Kozhikode, KL", score: "72.18", established: 1996, type: "Government", fees: "₹15 L/yr", package: "₹22 LPA" },
  { rank: 6, name: "XLRI Jamshedpur", category: "Management", location: "Jamshedpur, JH", score: "71.22", established: 1949, type: "Private", fees: "₹24 L/yr", package: "₹28 LPA" },
  { rank: 7, name: "MDI Gurgaon", category: "Management", location: "Gurgaon, HR", score: "65.11", established: 1973, type: "Private", fees: "₹19 L/yr", package: "₹20 LPA" },
  { rank: 8, name: "SP Jain Mumbai", category: "Management", location: "Mumbai, MH", score: "63.44", established: 1981, type: "Private", fees: "₹18 L/yr", package: "₹19 LPA" },
  { rank: 9, name: "IIFT Delhi", category: "Management", location: "Delhi", score: "62.91", established: 1963, type: "Government", fees: "₹16 L/yr", package: "₹18 LPA" },
  { rank: 10, name: "IMT Ghaziabad", category: "Management", location: "Ghaziabad, UP", score: "58.34", established: 1980, type: "Private", fees: "₹14 L/yr", package: "₹16 LPA" },
  // Medical
  { rank: 1, name: "AIIMS Delhi", category: "Medical", location: "Delhi", score: "88.96", established: 1956, type: "Government", fees: "₹10K/yr", package: "₹12 LPA" },
  { rank: 2, name: "PGIMER Chandigarh", category: "Medical", location: "Chandigarh", score: "82.44", established: 1962, type: "Government", fees: "₹30K/yr", package: "₹11 LPA" },
  { rank: 3, name: "CMC Vellore", category: "Medical", location: "Vellore, TN", score: "79.12", established: 1900, type: "Private", fees: "₹1.5 L/yr", package: "₹10 LPA" },
  { rank: 4, name: "Manipal College of Med", category: "Medical", location: "Manipal, KA", score: "62.18", established: 1953, type: "Deemed", fees: "₹20 L/yr", package: "₹9 LPA" },
  { rank: 5, name: "JSS Medical Mysore", category: "Medical", location: "Mysore, KA", score: "58.91", established: 1984, type: "Deemed", fees: "₹14 L/yr", package: "₹8 LPA" },
  // Law
  { rank: 1, name: "NLSIU Bangalore", category: "Law", location: "Bangalore, KA", score: "79.46", established: 1987, type: "Government", fees: "₹2.4 L/yr", package: "₹15 LPA" },
  { rank: 2, name: "NALSAR Hyderabad", category: "Law", location: "Hyderabad, TS", score: "75.12", established: 1998, type: "Government", fees: "₹2.2 L/yr", package: "₹13 LPA" },
  { rank: 3, name: "NUJS Kolkata", category: "Law", location: "Kolkata, WB", score: "72.88", established: 1999, type: "Government", fees: "₹2 L/yr", package: "₹12 LPA" },
  { rank: 4, name: "NLU Delhi", category: "Law", location: "Delhi", score: "70.11", established: 2008, type: "Government", fees: "₹1.8 L/yr", package: "₹11 LPA" },
  { rank: 5, name: "Symbiosis Law Pune", category: "Law", location: "Pune, MH", score: "62.44", established: 1977, type: "Private", fees: "₹3.5 L/yr", package: "₹9 LPA" },
  // University (Overall)
  { rank: 1, name: "IISc Bangalore", category: "University", location: "Bangalore, KA", score: "83.97", established: 1909, type: "Government", fees: "₹35K/yr", package: "₹18 LPA" },
  { rank: 2, name: "JNU Delhi", category: "University", location: "Delhi", score: "68.25", established: 1969, type: "Government", fees: "₹15K/yr", package: "₹10 LPA" },
  { rank: 3, name: "BHU Varanasi", category: "University", location: "Varanasi, UP", score: "61.13", established: 1916, type: "Government", fees: "₹20K/yr", package: "₹9 LPA" },
  { rank: 4, name: "Jadavpur University", category: "University", location: "Kolkata, WB", score: "59.88", established: 1955, type: "Government", fees: "₹25K/yr", package: "₹8 LPA" },
  { rank: 5, name: "Amrita Vishwa Vidyapeetham", category: "University", location: "Coimbatore, TN", score: "58.24", established: 2003, type: "Deemed", fees: "₹1.5 L/yr", package: "₹8 LPA" },
];

const CATEGORIES = ["All", "Engineering", "Management", "Medical", "Law", "University"];

const TYPE_BADGE: Record<string, string> = {
  Government: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Private: "bg-blue-50 text-blue-700 border-blue-200",
  Deemed: "bg-violet-50 text-violet-700 border-violet-200",
};

const NIRFInsightsPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"rank" | "score" | "fees">("rank");

  const filtered = useMemo(() => {
    let data = activeCategory === "All" ? NIRF_DATA : NIRF_DATA.filter(d => d.category === activeCategory);
    if (searchTerm.trim()) {
      data = data.filter(d => d.name.toLowerCase().includes(searchTerm.toLowerCase()) || d.location.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    if (sortBy === "rank") return [...data].sort((a, b) => a.rank - b.rank);
    if (sortBy === "score") return [...data].sort((a, b) => parseFloat(b.score) - parseFloat(a.score));
    return data;
  }, [activeCategory, searchTerm, sortBy]);

  return (
    <div className="min-h-screen bg-[#f2f4f7]">
      <Helmet>
        <title>NIRF Rankings 2026 – Top Colleges in India by Category | StudyCups</title>
        <meta name="description" content="Explore official NIRF Rankings 2026 for top colleges in India. Compare engineering, management, medical, law rankings with fees and placement data." />
        <meta name="keywords" content="NIRF Rankings 2026, top engineering colleges India, best MBA colleges NIRF, NIRF medical ranking, IIT ranking, IIM ranking, NLU ranking, StudyCups" />
        <link rel="canonical" href="https://studycups.in/nirf-insights" />
        <meta name="robots" content="index, follow" />
        <meta property="og:title" content="NIRF Rankings 2026 – India's Best Colleges | StudyCups" />
        <meta property="og:description" content="Official NIRF 2026 rankings for engineering, management, medical and law colleges with fees." />
        <meta property="og:url" content="https://studycups.in/nirf-insights" />
        <meta property="og:image" content="https://studycups.in/logos/StudyCups.png" />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://studycups.in" },
            { "@type": "ListItem", "position": 2, "name": "NIRF Insights 2026", "item": "https://studycups.in/nirf-insights" }
          ]
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
            <span className="text-amber-400 font-medium">NIRF Insights 2026</span>
          </nav>
          <div className="flex flex-col lg:flex-row gap-6 items-start">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-0.5 mb-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-amber-300">OFFICIAL DATA · NIRF 2026 · MINISTRY OF EDUCATION</span>
              </div>
              <h1 className="text-[24px] sm:text-[32px] md:text-[40px] font-extrabold leading-tight text-white mb-2">
                <span className="bg-gradient-to-r from-amber-300 via-orange-400 to-amber-500 bg-clip-text text-transparent">NIRF Rankings</span> 2026
              </h1>
              <p className="text-white/65 text-[12px] md:text-[13px] leading-relaxed max-w-xl mb-3">
                Official <strong className="text-white/90">National Institutional Ranking Framework</strong> data — explore IIT, IIM, AIIMS, NLU and 100+ top colleges by rank, score, fees and placements.
              </p>
              {/* Search */}
              <div className="relative max-w-md">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="search"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Search college or city..."
                  className="w-full h-10 rounded-xl bg-white/10 border border-white/15 pl-10 pr-4 text-[13px] text-white placeholder-white/40 focus:outline-none focus:border-amber-400/60 backdrop-blur-sm"
                />
              </div>
            </div>
            <div className="lg:w-[200px] flex-shrink-0 rounded-2xl border border-white/10 bg-white/[0.06] backdrop-blur-sm p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-amber-300/80 mb-2">Quick Stats</p>
              {[
                { label: "Ranked Colleges", val: "35+" },
                { label: "Categories", val: "5" },
                { label: "Avg Top IIT Score", val: "82+" },
                { label: "Avg Top IIM Score", val: "79+" },
              ].map(s => (
                <div key={s.label} className="flex justify-between border-b border-white/10 py-1.5 text-[11px]">
                  <span className="text-white/60">{s.label}</span>
                  <span className="text-white font-bold">{s.val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="relative w-full overflow-hidden leading-[0] h-6">
          <svg viewBox="0 0 1440 60" preserveAspectRatio="none" className="absolute bottom-0 w-full h-full" fill="#f2f4f7">
            <path d="M0,30 C360,60 1080,0 1440,30 L1440,60 L0,60 Z" />
          </svg>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 py-6 pb-16">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <div className="flex flex-wrap gap-2 flex-1">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-[11px] font-bold border transition ${
                  activeCategory === cat
                    ? "bg-gradient-to-r from-amber-400 to-orange-500 text-[#0a1628] border-amber-400"
                    : "bg-white text-slate-600 border-slate-200 hover:border-amber-400"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            className="h-8 rounded-xl border border-slate-200 bg-white px-3 text-[11px] text-slate-600 focus:outline-none"
          >
            <option value="rank">Sort: By Rank</option>
            <option value="score">Sort: By Score</option>
          </select>
        </div>

        <div className="mb-3">
          <div className="h-1 w-8 bg-gradient-to-r from-[#1f4fa8] to-amber-400 rounded mb-1.5" />
          <h2 className="text-[17px] font-extrabold text-slate-800">{activeCategory === "All" ? "All" : activeCategory} Rankings 2026 <span className="text-[13px] font-normal text-slate-500 ml-1">({filtered.length} colleges)</span></h2>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="bg-gradient-to-r from-[#0a214a] to-[#1f4fa8] text-white text-[11px] uppercase tracking-wide">
                  <th className="px-4 py-3 text-left">Rank</th>
                  <th className="px-4 py-3 text-left">College</th>
                  <th className="px-4 py-3 text-left">Category</th>
                  <th className="px-4 py-3 text-left">Type</th>
                  <th className="px-4 py-3 text-left">Score</th>
                  <th className="px-4 py-3 text-left">Fees</th>
                  <th className="px-4 py-3 text-left">Avg Package</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item, idx) => (
                  <tr key={idx} className="border-t border-slate-50 hover:bg-slate-50 transition">
                    <td className="px-4 py-3">
                      <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-[12px] font-bold ${item.rank <= 3 ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"}`}>
                        #{item.rank}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-[13px] font-bold text-slate-900">{item.name}</p>
                      <p className="text-[11px] text-slate-400">{item.location} · Est. {item.established}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100 font-semibold">{item.category}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${TYPE_BADGE[item.type] || "bg-slate-50 text-slate-600 border-slate-200"}`}>{item.type}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-bold text-emerald-700">{item.score}</span>
                        <div className="w-16 h-1.5 rounded bg-slate-100">
                          <div className="h-full rounded bg-gradient-to-r from-emerald-400 to-teal-500" style={{ width: `${Math.min(100, parseFloat(item.score))}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[12px] font-semibold text-slate-700">{item.fees}</td>
                    <td className="px-4 py-3 text-[12px] font-semibold text-indigo-600">{item.package}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-8 bg-gradient-to-br from-[#0a214a] to-[#1f4fa8] rounded-2xl p-6 text-center">
          <h3 className="text-[18px] font-bold text-white mb-2">Want to Apply to These Top Colleges?</h3>
          <p className="text-white/65 text-[13px] mb-4">Our expert counsellors help you prepare the perfect application for NIRF-ranked colleges.</p>
          <div className="flex gap-3 justify-center flex-wrap">
            <button onClick={() => navigate("/college-predictor")} className="px-6 py-2.5 bg-gradient-to-r from-amber-400 to-orange-500 text-[#0a1628] font-bold rounded-xl text-sm shadow hover:opacity-90 transition">
              🎯 Predict My Colleges →
            </button>
            <button onClick={() => navigate("/free-counselling")} className="px-6 py-2.5 bg-white/10 border border-white/20 text-white font-semibold rounded-xl text-sm hover:bg-white/20 transition">
              📞 Free Counselling
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NIRFInsightsPage;
