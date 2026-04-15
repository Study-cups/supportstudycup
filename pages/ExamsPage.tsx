import React, { useEffect, useState, useMemo } from "react";
import type { View } from "../types";
import { useOnScreen } from "../hooks/useOnScreen";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";

interface ExamsPageProps {
  setView: (view: View) => void;
}

const toExamSlug = (exam: any) =>
  exam.name
    .toLowerCase()
    .replace(/\([^)]*\)/g, "")
    .replace(/[^\w\s]/g, "")
    .trim()
    .replace(/\s+/g, "-") +
  (exam.year ? `-${exam.year}` : "");


const AnimatedCard: React.FC<{ children: React.ReactNode; delay: number }> = ({
  children,
  delay,
}) => {
  return (
    <div
      className="animate-fadeInUp"
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};


const ExamsPage: React.FC = () => {
  const navigate = useNavigate();
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showAllNews, setShowAllNews] = useState(false);



  useEffect(() => {
    const fetchExams = async () => {
      try {
        const res = await fetch("https://studycupsbackend-wb8p.onrender.com/api/exams");
        const json = await res.json();
        setExams(json.data || []);
      } catch (err) {
      } finally {
        setLoading(false);
      }
    };

    fetchExams();
  }, []);


  const getExamDate = (exam: any) => {
  if (Array.isArray(exam.important_dates) && exam.important_dates.length > 0) {
    return exam.important_dates[0].exam_date || "TBA";
  }
  return "TBA";
};

const examNews = [
  {
    title: "CAT 2025 Result Expected This Week",
    date: "Dec 19, 2025",
    type: "Breaking"
  },
  {
    title: "XAT 2026 Admit Card Released on Official Website",
    date: "Dec 18, 2025",
    type: "Alert"
  },
  {
    title: "JEE Main 2026 Exam Dates Announced by NTA",
    date: "Dec 16, 2025",
    type: "Breaking"
  },
  {
    title: "GATE 2026 Registration Window Closing Soon",
    date: "Dec 15, 2025",
    type: "Alert"
  },
  {
    title: "CUET UG 2026 Application Process to Begin in February",
    date: "Dec 14, 2025",
    type: "Update"
  },
  {
    title: "CAT 2025 Final Answer Key Released by IIM",
    date: "Dec 13, 2025",
    type: "Update"
  },
  {
    title: "XAT 2026 Exam City Slip Available for Download",
    date: "Dec 12, 2025",
    type: "Alert"
  },
  {
    title: "JEE Advanced 2026 Eligibility Criteria Revised",
    date: "Dec 11, 2025",
    type: "Breaking"
  },
  {
    title: "GATE 2026 Exam Pattern and Paper Codes Released",
    date: "Dec 10, 2025",
    type: "Update"
  },
  {
    title: "CUET PG 2026 to Be Conducted in CBT Mode",
    date: "Dec 09, 2025",
    type: "Update"
  }
];

const visibleNews = showAllNews
  ? examNews
  : examNews.slice(0, 5);

  const filteredExams = useMemo(() => {
    return exams.filter((exam) => {
      const matchesSearch =
        searchTerm.trim() === "" ||
        exam.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exam.conductingBody?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory =
        selectedCategory === "All" ||
        exam.stream === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [exams, searchTerm, selectedCategory]);

  const examCategories = useMemo(() => {
  const set = new Set<string>();

  exams.forEach((exam) => {
    if (exam.stream && typeof exam.stream === "string") {
      set.add(exam.stream.trim());
    }
  });

  return ["All", ...Array.from(set)];
}, [exams]);



  return (
    <div className="bg-[#f2f4f7] pt-0 pb-16">
      <Helmet>
        <title>Entrance Exams 2026 - CAT, JEE, NEET, GATE, CUET | StudyCups</title>
        <meta name="description" content="Find all entrance exams 2026 in India - CAT, JEE Main, JEE Advanced, NEET, GATE, CUET, XAT and more. Check exam dates, eligibility, syllabus and registration details." />
        <meta name="keywords" content="entrance exams 2026, CAT exam, JEE Main 2026, NEET 2026, GATE 2026, CUET 2026, MBA entrance exam, engineering entrance exam, medical entrance exam, exam dates 2026, StudyCups" />
        <link rel="canonical" href="https://studycups.in/exams" />

        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="StudyCups" />
        <meta property="og:title" content="Entrance Exams 2026 - CAT, JEE, NEET, GATE, CUET | StudyCups" />
        <meta property="og:description" content="All entrance exams 2026 - dates, eligibility, syllabus and registration. CAT, JEE, NEET, GATE, CUET and more." />
        <meta property="og:url" content="https://studycups.in/exams" />
        <meta property="og:image" content="https://studycups.in/logos/StudyCups.png" />
        <meta property="og:locale" content="en_IN" />
        <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Entrance Exams 2026 - CAT, JEE, NEET, GATE | StudyCups" />
        <meta name="twitter:description" content="All entrance exams 2026 - dates, eligibility, syllabus and registration details." />
        <meta name="twitter:image" content="https://studycups.in/logos/StudyCups.png" />

        {/* JSON-LD: BreadcrumbList */}
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            {"@type":"ListItem","position":1,"name":"Home","item":"https://studycups.in"},
            {"@type":"ListItem","position":2,"name":"Entrance Exams 2026","item":"https://studycups.in/exams"}
          ]
        })}</script>

        {/* JSON-LD: ItemList of exams */}
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "ItemList",
          "name": "Entrance Exams 2026 India",
          "description": "Complete list of entrance exams in India 2026",
          "url": "https://studycups.in/exams",
          "itemListElement": exams.slice(0, 10).map((exam: any, idx: number) => ({
            "@type": "ListItem",
            "position": idx + 1,
            "name": exam.name,
            "url": `https://studycups.in/exams/${exam.name?.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")}${exam.year ? `-${exam.year}` : ""}`
          }))
        })}</script>
      </Helmet>

      {/* ================= HERO SECTION ================= */}
      <section className="relative md:mt-[100px] mt-0 overflow-hidden">
        {/* 4-layer gradient bg */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#030c1a] via-[#061528] to-[#0b2545]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(14,165,233,0.18)_0%,transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(245,158,11,0.14)_0%,transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.08)_0%,transparent_70%)]" />

        {/* 3 glow orbs */}
        <div className="pointer-events-none absolute top-[-60px] left-[-60px] w-[300px] h-[300px] rounded-full bg-indigo-600/20 blur-[80px]" />
        <div className="pointer-events-none absolute bottom-[-40px] right-[10%] w-[250px] h-[250px] rounded-full bg-sky-500/15 blur-[70px]" />
        <div className="pointer-events-none absolute top-[30%] right-[-40px] w-[200px] h-[200px] rounded-full bg-amber-400/10 blur-[60px]" />

        {/* dot-grid overlay */}
        <div className="absolute inset-0 opacity-[0.04]" style={{backgroundImage:"radial-gradient(circle,#fff 1px,transparent 1px)",backgroundSize:"28px 28px"}} />

        <div className="relative max-w-7xl mx-auto px-4 py-5 md:py-8">
          {/* breadcrumb */}
          <nav aria-label="breadcrumb" className="mb-3 flex items-center gap-1.5 text-[11px] text-white/50">
            <a href="/" className="hover:text-white transition">Home</a>
            <span>/</span>
            <span className="text-amber-400 font-medium">Entrance Exams 2026</span>
          </nav>

          <div className="flex flex-col lg:flex-row gap-6 items-start">
            {/* Left content */}
            <div className="flex-1">
              {/* animated badge */}
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-0.5 mb-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-amber-300">
                  2026 EXAMS OPEN · CAT · JEE · NEET · GATE · CUET
                </span>
              </div>

              <h1 className="text-[22px] sm:text-[30px] md:text-[36px] font-extrabold leading-tight text-white mb-2">
                <span className="bg-gradient-to-r from-amber-300 via-orange-400 to-amber-500 bg-clip-text text-transparent">
                  Entrance Exams
                </span>{" "}
                in India 2026
              </h1>

              <p className="text-white/65 text-[12px] md:text-[13px] leading-relaxed max-w-xl mb-3">
                Compare <strong className="text-white/90">CAT, JEE Main, JEE Advanced, NEET, GATE, CUET, XAT</strong> &amp; 50+ exams — eligibility criteria, syllabus, important dates, registration, admit card &amp; result updates.
              </p>

              {/* Search bar */}
              <div className="relative max-w-lg mb-3">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
                <input
                  type="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search CAT, JEE, NEET, GATE, CUET..."
                  className="w-full h-10 rounded-xl bg-white/10 border border-white/15 pl-10 pr-4 text-[13px] text-white placeholder-white/40 focus:outline-none focus:border-amber-400/60 focus:bg-white/15 transition backdrop-blur-sm"
                />
              </div>

              {/* 4 inline stats */}
              <div className="flex flex-wrap gap-4 mt-2 text-white/80 text-[11px]">
                <span>📋 <strong className="text-white">{exams.length}+</strong> Exams Listed</span>
                <span>🏛️ <strong className="text-white">500+</strong> Accepting Colleges</span>
                <span>📅 <strong className="text-white">2026</strong> Updated Dates</span>
                <span>⭐ <strong className="text-white">Free</strong> Counselling</span>
              </div>
            </div>

            {/* Right stats card */}
            <div className="lg:w-[220px] w-full flex-shrink-0 rounded-2xl border border-white/10 bg-white/[0.06] backdrop-blur-sm p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-amber-300/80 mb-1">Quick Stats</p>
              <div className="text-[2.2rem] font-extrabold text-white leading-none mb-3">50+</div>
              <div className="space-y-2 text-[12px]">
                {[
                  {label:"Engineering Exams", val:"JEE, GATE, VITEEE"},
                  {label:"MBA/Management", val:"CAT, XAT, MAT"},
                  {label:"Medical Exams", val:"NEET, AIIMS"},
                  {label:"Law Entrance", val:"CLAT, AILET"},
                  {label:"Central Univ.", val:"CUET UG/PG"},
                ].map(row => (
                  <div key={row.label} className="flex items-center justify-between border-b border-white/10 pb-1.5">
                    <span className="text-white/60">{row.label}</span>
                    <span className="text-white font-semibold text-[11px]">{row.val}</span>
                  </div>
                ))}
              </div>
              <button className="mt-3 w-full py-2 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-[11px] font-bold text-[#0a1628]">
                Free Counselling →
              </button>
            </div>
          </div>
        </div>

        {/* Wave SVG divider */}
        <div className="relative w-full overflow-hidden leading-[0] h-6">
          <svg viewBox="0 0 1440 60" preserveAspectRatio="none" className="absolute bottom-0 w-full h-full" fill="#f2f4f7">
            <path d="M0,30 C360,60 1080,0 1440,30 L1440,60 L0,60 Z"/>
          </svg>
        </div>
      </section>

      {/* ================= CATEGORY FILTER CHIPS ================= */}
      <div className="max-w-7xl mx-auto px-4 pt-4 pb-2">
        <div className="flex flex-wrap gap-2">
          {examCategories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-full text-[11px] font-semibold border transition ${
                selectedCategory === cat
                  ? "bg-gradient-to-r from-amber-400 to-orange-500 text-[#0a1628] border-amber-400"
                  : "bg-white text-slate-600 border-slate-200 hover:border-amber-400 hover:text-amber-600"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">

          {/* ================= LEFT CONTENT ================= */}
          <div className="lg:col-span-9 space-y-4 md:space-y-6">

            {/* EXAMS LIST */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* LOADING STATE (SKELETON) */}
              {loading &&
                [...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="bg-white border rounded-xl p-5 animate-pulse"
                  >
                    <div className="flex gap-4">
                      <div className="h-12 w-12 bg-slate-200 rounded" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 bg-slate-200 rounded w-3/4" />
                        <div className="h-2 bg-slate-200 rounded w-1/2" />
                      </div>
                    </div>

                    <div className="mt-4 space-y-2">
                      <div className="h-2 bg-slate-200 rounded" />
                      <div className="h-2 bg-slate-200 rounded" />
                    </div>
                  </div>
                ))}

              {/* REAL DATA */}
              {!loading &&
                filteredExams.map((exam, index) => (
                  <AnimatedCard key={exam.id} delay={index * 40}>
                    <article
                      onClick={() => navigate(`/exams/${toExamSlug(exam)}`)}
                      aria-label={`${exam.name} – entrance exam 2026`}
                      className="bg-white rounded-2xl border border-slate-100 shadow-[0_4px_20px_rgba(10,33,74,0.07)] hover:shadow-[0_10px_35px_rgba(10,33,74,0.14)] hover:-translate-y-1 transition-all duration-300 overflow-hidden cursor-pointer flex flex-col"
                    >
                      {/* top gradient accent bar */}
                      <div className="h-1 w-full bg-gradient-to-r from-[#1f4fa8] to-[#0ea5e9]" />

                      <div className="p-5 flex-1 flex flex-col">
                        {/* header row */}
                        <div className="flex items-start gap-3 mb-3">
                          <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-[#0a214a]/10 to-[#1f4fa8]/20 flex items-center justify-center border border-[#1f4fa8]/10 p-1">
                            <img
                              src={exam.logoUrl || "/icons/exam-default.png"}
                              alt={exam.name}
                              className="h-full w-full object-contain"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h2 className="font-bold text-[14px] text-slate-900 leading-snug line-clamp-2">{exam.name}</h2>
                            <p className="text-[11px] text-slate-500 mt-0.5">{exam.highlights?.conducting_body || "—"}</p>
                          </div>
                          <span className="flex-shrink-0 text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100 font-semibold">{exam.stream || "General"}</span>
                        </div>

                        {/* stats grid */}
                        <div className="grid grid-cols-2 gap-2 mb-3 text-[11px]">
                          <div className="bg-slate-50 rounded-lg px-3 py-2">
                            <p className="text-slate-400 text-[10px] uppercase tracking-wide">Level</p>
                            <p className="font-semibold text-slate-700 mt-0.5">{exam.highlights?.exam_level || "—"}</p>
                          </div>
                          <div className="bg-slate-50 rounded-lg px-3 py-2">
                            <p className="text-slate-400 text-[10px] uppercase tracking-wide">Mode</p>
                            <p className="font-semibold text-slate-700 mt-0.5">{exam.highlights?.mode_of_exam || "—"}</p>
                          </div>
                          <div className="bg-amber-50 rounded-lg px-3 py-2">
                            <p className="text-amber-500 text-[10px] uppercase tracking-wide">Exam Date</p>
                            <p className="font-semibold text-amber-700 mt-0.5">{getExamDate(exam)}</p>
                          </div>
                          <div className="bg-slate-50 rounded-lg px-3 py-2">
                            <p className="text-slate-400 text-[10px] uppercase tracking-wide">Duration</p>
                            <p className="font-semibold text-slate-700 mt-0.5">{exam.highlights?.exam_duration || "—"}</p>
                          </div>
                        </div>

                        <div className="flex-1" />

                        {/* footer */}
                        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                          <span className="text-[11px] font-bold text-[#1f4fa8]">View Full Details →</span>
                          <span className="px-3 py-1.5 text-[11px] bg-gradient-to-r from-[#f59e0b] to-[#d97706] text-white rounded-full font-bold shadow-sm">
                            Apply Now
                          </span>
                        </div>
                      </div>
                    </article>
                  </AnimatedCard>
                ))}
            </div>

          </div>

          {/* ================= RIGHT SIDEBAR ================= */}
          <aside className="
  hidden lg:block
  lg:col-span-3
  space-y-6
  sticky top-28 h-fit">

            {/* Exam News & Alerts */}
            <div className="bg-white border rounded-xl p-4">

              {/* HEADER */}
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-slate-900">
                  Exam News &amp; Alerts
                </h3>

                <span className="text-[11px] px-2 py-0.5 rounded-full bg-red-100 text-red-600 font-semibold">
                  LIVE
                </span>
              </div>
              <div>
                {/* NEWS LIST */}
                <div className="space-y-3 exam-news-marquee">
                  {visibleNews.map((news, idx) => (
                    <div
                      key={idx}
                      className="
                        flex gap-3 items-start
                        border-l-4 border-red-500
                        bg-red-50
                        px-3 py-2 rounded-md
                        hover:bg-red-100 transition
                      "
                    >
                      <span className="mt-0.5 text-red-600">⚠️</span>

                      <div className="flex-1">
                        <p className="text-xs md:text-sm font-semibold text-slate-800 leading-snug">
                          {news.title}
                        </p>

                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[11px] text-slate-500">
                            {news.date}
                          </span>

                          <span
                            className={`
                              text-[10px] px-2 py-0.5 rounded-full font-semibold
                              ${
                                news.type === "Breaking"
                                  ? "bg-red-600 text-white"
                                  : news.type === "Alert"
                                  ? "bg-orange-500 text-white"
                                  : "bg-blue-500 text-white"
                              }
                            `}
                          >
                            {news.type}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* READ MORE BUTTON */}
              {examNews.length > 5 && (
                <button
                  onClick={() => setShowAllNews(!showAllNews)}
                  className="
                    mt-4 w-full text-center
                    text-sm font-semibold
                    text-red-600 hover:text-red-700
                    transition
                  "
                >
                  {showAllNews ? "Read Less ↑" : "Read More ↓"}
                </button>
              )}
            </div>

            {/* Subscribe to Newsletter */}
            <div className="rounded-xl overflow-hidden bg-gradient-to-br from-[#0a214a] to-[#1f4fa8] p-5">
              <h3 className="font-bold text-white text-[14px] mb-1">
                Subscribe to our Newsletter
              </h3>
              <p className="text-white/65 text-[11px] mb-3 leading-relaxed">
                Get exam alerts, result updates, and counselling tips straight to your inbox.
              </p>
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full h-9 rounded-lg bg-white/10 border border-white/20 px-3 text-[12px] text-white placeholder-white/40 focus:outline-none focus:border-amber-400/70 focus:bg-white/15 transition mb-2"
              />
              <button className="w-full py-2 rounded-lg bg-gradient-to-r from-amber-400 to-orange-500 text-[11px] font-bold text-[#0a1628] hover:opacity-90 transition">
                Subscribe Now →
              </button>
            </div>

            {/* Upcoming Exams */}
            <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-[0_2px_10px_rgba(10,33,74,0.06)]">
              <h3 className="font-bold text-slate-900 text-[14px] mb-3">Upcoming Exams</h3>
              <ul className="space-y-2">
                {[
                  { name: "JEE Advanced 2025", date: "May 2025" },
                  { name: "TS EAMCET 2025", date: "Jun 2025" },
                  { name: "GATE 2026", date: "Feb 2026" },
                ].map((item) => (
                  <li
                    key={item.name}
                    className="flex items-center justify-between border-l-4 border-amber-400 bg-amber-50/60 rounded-r-lg pl-3 pr-2 py-2"
                  >
                    <span className="text-[12px] font-semibold text-slate-800">{item.name}</span>
                    <span className="text-[10px] text-amber-600 font-medium">{item.date}</span>
                  </li>
                ))}
              </ul>
            </div>

          </aside>
        </div>
      </div>
    </div>
  );
};

export default ExamsPage;
