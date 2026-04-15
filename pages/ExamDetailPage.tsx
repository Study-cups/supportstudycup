import React, { useState, useEffect } from "react";
import type { View } from "../types";
import { useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";

interface ExamDetailPageProps {
  examId: number;
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

const pickExamText = (...values: any[]) => {
  for (const value of values) {
    if (Array.isArray(value)) {
      const joined = value
        .map((item) => (item == null ? "" : String(item).trim()))
        .filter(Boolean)
        .join(", ");

      if (joined) {
        return joined;
      }

      continue;
    }

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }

    if (value !== null && value !== undefined && value !== "") {
      return String(value);
    }
  }

  return "N/A";
};


const ExamDetailPage: React.FC<{ exams: any[] }> = ({ exams }) => {

  
  const navigate = useNavigate();
 const { examSlug } = useParams<{ examSlug: string }>();


  const [exam, setExam] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("Overview");
  const [loading, setLoading] = useState(true);

  const tabs = ["Overview", "Eligibility", "Syllabus", "Important Dates"];

  /* ================= FETCH ================= */
 useEffect(() => {
  // slug nahi hai → kuch mat karo
  if (!examSlug) return;

  // exams abhi load nahi hue → wait karo
  if (!Array.isArray(exams) || exams.length === 0) {
    return;
  }

  const matchedExam = exams.find(
    (e) => toExamSlug(e) === examSlug
  );

  // slug galat hai
  if (!matchedExam) {
    setExam(null);
    setLoading(false);
    return;
  }

  const fetchExamById = async () => {
    try {
      const res = await fetch(
        `https://studycupsbackend-wb8p.onrender.com/api/exams/${matchedExam.id}`
      );
      const json = await res.json();

      if (json.success) {
        setExam(json.data);
      } else {
        setExam(null);
      }
    } catch (err) {
      console.error("Exam API Error", err);
      setExam(null);
    } finally {
      setLoading(false); // ✅ GUARANTEED
    }
  };

  fetchExamById();
}, [examSlug, exams]);


  if (loading) {
    return <p className="text-center py-20">Loading exam details…</p>;
  }

  if (!exam) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-bold">Exam not found</h2>
        <button
        onClick={() => navigate("/exams")}

          className="mt-4 px-6 py-2 bg-blue-600 text-white rounded"
        >
          Back to Exams
        </button>
      </div>
    );
  }
  const conductingBody = pickExamText(exam.highlights?.conducting_body);
  const examLevel = pickExamText(exam.highlights?.exam_level);
  const modeOfExam = pickExamText(exam.highlights?.mode_of_exam);
  const examDuration = pickExamText(exam.highlights?.exam_duration);
  const counsellingMode = pickExamText(exam.highlights?.mode_of_counselling);
  const applicationMode = pickExamText(exam.highlights?.mode_of_application);
  const participatingColleges = pickExamText(
    exam.highlights?.participating_colleges
  );
  const frequency = pickExamText(exam.highlights?.frequency_of_conduct);
  const examShortName = pickExamText(
    exam.highlights?.short_exam_name,
    exam.name
  );
  const heroDescription =
    (typeof exam.about?.description === "string" &&
      exam.about.description.trim()) ||
    `${exam.name} exam details including eligibility, syllabus, important dates, exam mode, and counselling updates.`;
  const heroYear = pickExamText(exam.year, new Date().getFullYear());
  const nextImportantDate = pickExamText(
    exam.important_dates?.[0]?.exam_date,
    exam.important_dates?.[0]?.result_date
  );

  

  const examName = exam.name || "Entrance Exam";
  const examYear = exam.year || "2026";
  const examMetaTitle = `${examName} ${examYear} - Dates, Eligibility, Syllabus, Result | StudyCups`;
  const examMetaDesc = `Get complete ${examName} ${examYear} details - exam dates, eligibility criteria, syllabus, registration process, admit card, result and counselling. Updated info on StudyCups.`;
  const examCanonical = `https://studycups.in/exams/${examSlug}`;

  /* ================= UI ================= */
  return (
    <div className="min-h-screen bg-slate-50">
      <Helmet>
        <title>{examMetaTitle}</title>
        <meta name="description" content={examMetaDesc} />
        <meta name="keywords" content={`${examName}, ${examName} ${examYear}, ${examName} eligibility, ${examName} syllabus, ${examName} exam date, ${examName} registration, ${examName} admit card, ${examName} result, entrance exam India`} />
        <link rel="canonical" href={examCanonical} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="StudyCups" />
        <meta property="og:title" content={examMetaTitle} />
        <meta property="og:description" content={examMetaDesc} />
        <meta property="og:url" content={examCanonical} />
        <meta property="og:image" content="https://studycups.in/logos/StudyCups.png" />
        <meta property="og:locale" content="en_IN" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={examMetaTitle} />
        <meta name="twitter:description" content={examMetaDesc} />
        <meta name="twitter:image" content="https://studycups.in/logos/StudyCups.png" />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://studycups.in" },
            { "@type": "ListItem", "position": 2, "name": "Exams", "item": "https://studycups.in/exams" },
            { "@type": "ListItem", "position": 3, "name": `${examName} ${examYear}`, "item": examCanonical }
          ]
        })}</script>
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Event",
          "name": `${examName} ${examYear}`,
          "description": heroDescription,
          "url": examCanonical,
          "organizer": { "@type": "Organization", "name": conductingBody !== "N/A" ? conductingBody : "NTA", "url": "https://studycups.in" },
          "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
          "location": { "@type": "Place", "name": "India", "address": { "@type": "PostalAddress", "addressCountry": "IN" } }
        })}</script>
        {exam.important_dates?.length > 0 && (
          <script type="application/ld+json">{JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": exam.eligibility?.basic_criteria?.slice(0, 4).map((c: any) => ({
              "@type": "Question",
              "name": c.particular,
              "acceptedAnswer": { "@type": "Answer", "text": c.detail }
            })) || []
          })}</script>
        )}
      </Helmet>

      {/* ===== HERO — CollegeDunia-style ===== */}
      <div className="bg-gradient-to-br from-[#0f2952] via-[#1E4A7A] to-[#0d3d6e] pt-[84px] pb-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">

          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-xs text-white/50 mb-4" aria-label="Breadcrumb">
            <button onClick={() => navigate("/")} className="hover:text-white transition">Home</button>
            <span>›</span>
            <button onClick={() => navigate("/exams")} className="hover:text-white transition">Exams</button>
            <span>›</span>
            <span className="text-white/80">{examName}</span>
          </nav>

          <div className="flex flex-col lg:flex-row lg:items-start gap-6">
            {/* Left: Title + info */}
            <div className="flex-1 min-w-0">
              {/* Badges */}
              <div className="flex flex-wrap gap-2 mb-3">
                {examLevel !== "N/A" && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-cyan-400/15 border border-cyan-400/30 text-cyan-200 text-[11px] font-bold uppercase tracking-wider">
                    {examLevel}
                  </span>
                )}
                {modeOfExam !== "N/A" && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-300 text-[11px] font-bold uppercase tracking-wider">
                    {modeOfExam}
                  </span>
                )}
                {frequency !== "N/A" && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white/70 text-[11px] font-semibold">
                    {frequency}
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white leading-tight">
                {examName} <span className="text-amber-300">{examYear}</span>
              </h1>
              <p className="text-sm text-white/65 mt-1 mb-4">
                Conducted by <span className="text-white/90 font-semibold">{conductingBody}</span>
              </p>

              <p className="text-sm text-white/70 leading-relaxed max-w-2xl line-clamp-3">
                {heroDescription}
              </p>

              {/* Key stat chips */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
                {[
                  { label: "Exam Level", value: examLevel },
                  { label: "Mode", value: modeOfExam },
                  { label: "Duration", value: examDuration },
                  { label: "Colleges", value: participatingColleges },
                ].map((s) => (
                  <div key={s.label} className="rounded-xl bg-white/8 border border-white/12 px-3 py-2.5">
                    <p className="text-[10px] uppercase tracking-wider text-white/45 font-semibold">{s.label}</p>
                    <p className="text-sm font-bold text-white mt-0.5 truncate">{s.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Snapshot card */}
            <div className="w-full lg:w-[300px] flex-shrink-0">
              <div className="rounded-2xl border border-white/15 bg-white/8 backdrop-blur p-5 shadow-xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center p-1.5 shadow">
                    <img
                      src={exam.logoUrl || "/icons/exam-default.png"}
                      className="w-full h-full object-contain"
                      alt={examName}
                      onError={(e: any) => { e.currentTarget.style.display = "none"; }}
                    />
                  </div>
                  <div>
                    <p className="text-[10px] text-white/50 uppercase tracking-wider">Exam</p>
                    <p className="text-sm font-bold text-white">{examShortName}</p>
                  </div>
                </div>
                <div className="space-y-2.5">
                  {[
                    { label: "Conducting Body", value: conductingBody },
                    { label: "Application Mode", value: applicationMode },
                    { label: "Counselling", value: counsellingMode },
                    { label: "Next Important Date", value: nextImportantDate },
                  ].map((item) => (
                    <div key={item.label} className="flex justify-between items-start gap-2 border-b border-white/8 pb-2 last:border-0 last:pb-0">
                      <span className="text-[11px] text-white/50 flex-shrink-0">{item.label}</span>
                      <span className="text-[11px] font-semibold text-white text-right">{item.value}</span>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => navigate("/free-counselling")}
                  className="mt-4 w-full bg-amber-400 hover:bg-amber-300 text-amber-900 font-bold text-sm py-2.5 rounded-xl transition"
                >
                  Get Free Counselling →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== MAIN LAYOUT ===== */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ===== MAIN CONTENT ===== */}
        <div className="lg:col-span-2 space-y-6">

          {/* About */}
          {exam.about?.description && (
            <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
                <span className="w-1 h-5 rounded-full bg-[#1E4A7A] inline-block"></span>
                About {examName}
              </h2>
              <p className="text-slate-700 text-sm sm:text-base leading-relaxed">{exam.about.description}</p>
              {exam.about?.about_table?.length >= 1 && (
                <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-sm">
                    <tbody>
                      {exam.about.about_table.map((row: any, index: number) => (
                        <tr key={index} className="border-b last:border-b-0 even:bg-slate-50">
                          <td className="px-4 py-3 font-semibold text-slate-700 w-[40%]">{row.section}</td>
                          <td className="px-4 py-3 text-slate-700">{row.detail}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          {/* Eligibility */}
          {exam.eligibility?.basic_criteria?.length > 0 && (
            <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <span className="w-1 h-5 rounded-full bg-green-500 inline-block"></span>
                Eligibility Criteria
              </h2>
              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-sm">
                  <tbody>
                    {exam.eligibility.basic_criteria.map((e: any, i: number) => (
                      <tr key={i} className="border-b last:border-b-0 even:bg-slate-50">
                        <td className="px-4 py-3 text-slate-600 font-medium w-[45%]">{e.particular}</td>
                        <td className="px-4 py-3 font-semibold text-slate-800">{e.detail}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {exam.eligibility?.course_wise_eligibility?.length > 0 && (
                <div className="mt-5">
                  <h3 className="font-bold text-slate-800 mb-3 text-sm">Course-wise Eligibility</h3>
                  <div className="space-y-2 text-sm text-slate-700">
                    {exam.eligibility.course_wise_eligibility.map((c: any, i: number) => (
                      <p key={i}><strong className="text-slate-900">{c.course}:</strong> {c.criteria}</p>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

          {/* Syllabus */}
          {exam.syllabus?.sections?.length > 0 && (
            <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-5 flex items-center gap-2">
                <span className="w-1 h-5 rounded-full bg-purple-500 inline-block"></span>
                Syllabus
              </h2>
              <div className="space-y-6">
                {exam.syllabus.sections.map((sec: any, i: number) => (
                  <div key={i}>
                    <h3 className="font-bold text-slate-800 text-base mb-3 pb-2 border-b border-slate-100">{sec.title}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {sec.content.map((ch: any, j: number) => (
                        <div key={j} className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
                          <p className="font-semibold text-slate-800 text-sm mb-1.5">{ch.chapter}</p>
                          {ch.raw_text?.length > 0 && (
                            <ul className="list-disc pl-4 text-xs text-slate-600 space-y-0.5">
                              {ch.raw_text.map((t: string, k: number) => <li key={k}>{t}</li>)}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Important Dates */}
          {exam.important_dates?.length > 0 && (
            <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <span className="w-1 h-5 rounded-full bg-amber-500 inline-block"></span>
                Important Dates {examYear}
              </h2>
              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-[#1E4A7A] text-white">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wider">Event</th>
                      <th className="px-4 py-3 text-right font-semibold text-xs uppercase tracking-wider">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {exam.important_dates.map((d: any, i: number) => (
                      <tr key={i} className="border-b last:border-b-0 even:bg-slate-50">
                        <td className="px-4 py-3 text-slate-700">{d.session}</td>
                        <td className="px-4 py-3 font-semibold text-[#1E4A7A] text-right">{d.exam_date || d.result_date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </div>

        {/* ===== SIDEBAR ===== */}
        <aside className="space-y-4 lg:sticky lg:top-[90px] self-start">

          {/* CTA */}
          <div className="bg-gradient-to-br from-[#1E4A7A] to-[#0f2952] text-white rounded-2xl p-5 shadow-lg">
            <p className="font-bold text-base mb-0.5">Get Exam Guidance</p>
            <p className="text-xs text-white/70 mb-4">Free counselling by admission experts</p>
            <button
              onClick={() => navigate("/free-counselling")}
              className="w-full bg-white text-[#1E4A7A] py-2.5 rounded-xl font-bold text-sm hover:bg-blue-50 transition"
            >
              Free Counselling →
            </button>
          </div>

          {/* Highlights Table */}
          {exam.highlights && (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
              <h3 className="font-bold text-slate-900 mb-3 text-xs uppercase tracking-widest text-slate-500">Exam Highlights</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <tbody>
                    {[
                      ["Full Name", exam.highlights.full_exam_name],
                      ["Short Name", exam.highlights.short_exam_name],
                      ["Conducting Body", exam.highlights.conducting_body],
                      ["Level", exam.highlights.exam_level],
                      ["Frequency", exam.highlights.frequency_of_conduct],
                      ["Application", exam.highlights.mode_of_application],
                      ["Mode", exam.highlights.mode_of_exam],
                      ["Counselling", exam.highlights.mode_of_counselling],
                      ["Duration", exam.highlights.exam_duration],
                      ["Colleges", exam.highlights.participating_colleges],
                      ["Languages", exam.highlights.languages?.join(", ")],
                    ].filter(([, v]) => v).map(([label, value], idx) => (
                      <tr key={idx} className="border-b last:border-b-0 even:bg-slate-50">
                        <td className="py-2 pr-3 text-slate-500 font-medium w-[42%]">{label}</td>
                        <td className="py-2 font-semibold text-slate-800">{value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Upcoming Dates */}
          {exam.important_dates?.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
              <h3 className="font-bold text-slate-900 mb-3 text-xs uppercase tracking-widest text-slate-500">Upcoming Dates</h3>
              <div className="space-y-2.5">
                {exam.important_dates.slice(0, 4).map((d: any, i: number) => (
                  <div key={i} className="flex justify-between items-start gap-2 text-xs border-b border-slate-50 pb-2 last:border-0 last:pb-0">
                    <span className="text-slate-600">{d.session}</span>
                    <span className="font-bold text-[#1E4A7A] text-right flex-shrink-0">{d.exam_date || d.result_date}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};

export default ExamDetailPage;
