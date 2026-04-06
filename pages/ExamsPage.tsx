import React, { useEffect, useState, useMemo } from "react";
import type { View } from "../types";
import { useOnScreen } from "../hooks/useOnScreen";
import { useNavigate } from "react-router-dom";

interface ExamsPageProps {
  exams?: any[];
  setView?: (view: View) => void;
}

const API_BASE =
  "https://studycupsbackend-wb8p.onrender.com/api";

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


const ExamsPage: React.FC<ExamsPageProps> = () => {
  const navigate = useNavigate();
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showAllNews, setShowAllNews] = useState(false);
 
  


  useEffect(() => {
    const fetchExams = async () => {
      try {
        const res = await fetch(`${API_BASE}/exams`);
        const json = await res.json();
        setExams(json.data || []);
      } catch {
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
    <div className="bg-[#f2f4f7] pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4">

    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">


          {/* ================= LEFT CONTENT ================= */}
        <div className="lg:col-span-9 space-y-4 md:space-y-6">


            {/* HEADER */}
            <div className="relative bg-[#eef3fb] rounded-lg p-6 overflow-hidden">
              <div className="relative z-10 max-w-[520px]">
              <h1 className="text-[22px] md:text-[26px] lg:text-[28px] font-bold text-slate-900">

                  Entrance Exams in India
                </h1>
               <p className="text-xs md:text-sm text-slate-600 mt-1">

                  Explore all national & state level entrance exams
                </p>
              </div>

              <img
                src="/icons/college entrance exam-bro.png"
                alt=""
                className="
                  absolute right-6 top-1/2 -translate-y-1/2
                  h-[360px] w-auto
                  hidden md:block pointer-events-none
                "
              />
            </div>

            {/* CATEGORIES */}
       
           
 {/* EXAMS LIST */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">

  {/* 🔹 LOADING STATE (SKELETON) */}
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

  {/* 🔹 REAL DATA */}
  {!loading &&
    filteredExams.map((exam, index) => (
      <AnimatedCard key={exam.id} delay={index * 40}>
        <div
          onClick={() => navigate(`/exams/${toExamSlug(exam)}`)}

          className="bg-white border rounded-xl p-5 hover:shadow-lg transition cursor-pointer"
        >
          {/* TOP */}
          <div className="flex items-start gap-4">
            <img
              src={exam.logoUrl || "/icons/exam-default.png"}
              alt={exam.name}
              className="h-12 w-12 object-contain"
            />

            <div className="flex-1">
              <h4 className="font-semibold text-slate-900 text-[14px] md:text-[15px] leading-snug">
                {exam.name}
              </h4>
              <p className="text-xs text-slate-600 mt-0.5">
                {exam.highlights?.conducting_body || "—"}
              </p>
            </div>

            <span className="text-[11px] px-2 py-1 rounded-full bg-blue-50 text-blue-700 font-medium">
              {exam.stream || "General"}
            </span>
          </div>

          {/* META */}
          <div className="mt-4 grid grid-cols-2 gap-y-2 text-xs md:text-sm text-slate-600">
            <span>Exam Level</span>
            <span className="text-right font-medium">
              {exam.highlights?.exam_level || "—"}
            </span>

            <span>Mode</span>
            <span className="text-right font-medium">
              {exam.highlights?.mode_of_exam || "—"}
            </span>

            <span>Exam Date</span>
            <span className="text-right font-medium">
              {getExamDate(exam)}
            </span>

            <span>Duration</span>
            <span className="text-right font-medium">
              {exam.highlights?.exam_duration || "—"}
            </span>
          </div>

          {/* FOOTER */}
          <div className="mt-4 pt-3 border-t flex justify-between items-center">
            <span className="text-xs font-semibold text-blue-700">
              View Exam Details →
            </span>
            <span className="px-3 py-1.5 text-xs bg-green-500 text-white rounded-full font-semibold">
              Apply
            </span>
          </div>
        </div>
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

          <div className="bg-white border rounded-xl p-4"> 

  {/* HEADER */} 

  <div className="flex items-center justify-between mb-3 ">
    <h3 className="font-semibold text-slate-900">
      Exam News & Alerts
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


            <div className="bg-[#0F2D52]-50 border border-[#0F2D52]-200 rounded-lg p-4">
              <h3 className="font-semibold text-white-200">
                Subscribe to our Newsletter
              </h3>
              <button className="mt-4 w-full bg-[#0F2D52] text-white py-2 rounded">
                Subscribe Now
              </button>
            </div>

            <div className="bg-white border rounded-lg p-4">
              <h3 className="font-semibold mb-3">Upcoming Exams</h3>
              <ul className="space-y-2 text-sm text-slate-700">
                <li>JEE Advanced 2025</li>
                <li>TS EAMCET 2025</li>
                <li>GATE 2026</li>
              </ul>
            </div>

          </aside>
        </div>
      </div>
    </div>
  );
};

export default ExamsPage;
