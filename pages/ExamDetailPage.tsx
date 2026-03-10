import React, { useState, useEffect } from "react";
import type { View } from "../types";
import { useParams, useNavigate } from "react-router-dom";

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

  

  /* ================= UI ================= */
  return (
    <div className="min-h-screen bg-slate-50 pt-10">
      {/* HERO */}
      <section className="relative overflow-hidden bg-[linear-gradient(120deg,#041a31_0%,#072746_62%,#10273d_100%)]">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-[-8%] top-[14%] h-56 w-56 rounded-full bg-[#0ea5b7]/12 blur-3xl" />
          <div className="absolute bottom-[-10%] right-[-4%] h-72 w-72 rounded-full bg-[#f3a11c]/12 blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 py-8 md:py-10">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.6fr)_360px] lg:items-start">
            <div className="max-w-[760px] text-white">
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <span className="inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-cyan-200">
                  {examLevel}
                </span>
                <span className="inline-flex rounded-full border border-[#f3a11c]/35 bg-[#f3a11c]/8 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-[#f3a11c]">
                  {modeOfExam}
                </span>
              </div>

              <div className="mt-4">
                <div className="flex flex-wrap items-center gap-2 text-sm text-white/60">
                  <button
                    type="button"
                    onClick={() => navigate("/")}
                    className="transition hover:text-white"
                  >
                    Home
                  </button>
                  <span className="text-white/30">&lt;</span>
                  <button
                    type="button"
                    onClick={() => navigate("/exams")}
                    className="transition hover:text-white"
                  >
                    Exams
                  </button>
                  <span className="text-white/30">&lt;</span>
                  <span className="font-medium text-[#f3a11c]">{exam.name}</span>
                </div>

                <h1
                  className="mt-5 text-[2.35rem] leading-[0.98] text-white md:text-[3.35rem]"
                  style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
                >
                  {exam.name}
                </h1>
                <p
                  className="text-[2.15rem] italic leading-none text-[#f3a11c] md:text-[3rem]"
                  style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
                >
                  Exam Details {heroYear}
                </p>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-white/80">
                <span>{conductingBody}</span>
                <span>{examDuration}</span>
                <span>{frequency}</span>
              </div>

              <p className="mt-4 max-w-[620px] text-sm leading-7 text-white/75 md:text-[0.98rem] line-clamp-2">
  {heroDescription}
</p>

              <div className="mt-6 grid max-w-[720px] grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
                  <p className="text-[11px] uppercase tracking-[0.12em] text-white/55">
                    Exam Level
                  </p>
                  <p className="mt-1 text-lg font-bold text-white">
                    {examLevel}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
                  <p className="text-[11px] uppercase tracking-[0.12em] text-white/55">
                    Mode
                  </p>
                  <p className="mt-1 text-lg font-bold text-white">
                    {modeOfExam}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
                  <p className="text-[11px] uppercase tracking-[0.12em] text-white/55">
                    Duration
                  </p>
                  <p className="mt-1 text-lg font-bold text-white">
                    {examDuration}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
                  <p className="text-[11px] uppercase tracking-[0.12em] text-white/55">
                    Colleges
                  </p>
                  <p className="mt-1 text-lg font-bold text-white">
                    {participatingColleges}
                  </p>
                </div>
              </div>
            </div>

            <div className="w-full lg:max-w-[360px]">
              <div className="rounded-[28px] border border-[#0b6675]/60 bg-[linear-gradient(180deg,rgba(27,58,82,0.96)_0%,rgba(26,47,67,0.92)_100%)] p-5 shadow-[0_24px_50px_rgba(4,20,38,0.24)] backdrop-blur">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-white/45">
                  Exam Snapshot
                </p>

                <div className="mt-5 rounded-2xl border border-[#0b6675]/60 bg-[#0d4253]/35 p-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={exam.logoUrl || "/icons/exam-default.png"}
                      className="h-12 w-12 rounded-xl bg-white p-2 object-contain"
                      alt={exam.name}
                    />
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.12em] text-cyan-100/70">
                        Exam focus
                      </p>
                      <p className="mt-1 text-sm font-semibold text-white">
                        {examShortName}
                      </p>
                    </div>
                  </div>
              
                </div>

                <div className="mt-4 space-y-3">
                  {[
                    { label: "Conducting Body", value: conductingBody },
                    { label: "Application Mode", value: applicationMode },
                    { label: "Counselling", value: counsellingMode },
                    { label: "Important Date", value: nextImportantDate },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3"
                    >
                      <p className="text-[11px] uppercase tracking-[0.12em] text-white/55">
                        {item.label}
                      </p>
                      <p className="mt-1 text-sm font-semibold leading-6 text-white">
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {false && (
      <div className="relative bg-[var(--primary-dark)] mt-5 pt-5 text-white">
        <div className="max-w-7xl mx-auto px-4 py-10">
          <button
           onClick={() => navigate("/exams")}

            className="text-sm mb-4 underline"
          >
            ← Back to Exams
          </button>

          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <img
              src={exam.logoUrl || "/icons/exam-default.png"}
              className="h-20 w-20 bg-white rounded-full p-2"
              alt=""
            />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">
                {exam.name}
              </h1>
              <p className="text-sm opacity-90">
                Conducted by {exam.highlights?.conducting_body}
              </p>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* TABS */}
   

      {/* CONTENT */}
     <div className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-1 lg:grid-cols-3 gap-8">

  {/* ================= MAIN CONTENT ================= */}
  <div className="lg:col-span-2 space-y-8">

    {/* ABOUT */}
    <div className="bg-white p-6 sm:p-8 rounded-2xl border">
      <h3 className="text-lg sm:text-xl font-bold mb-3">
        About {exam.name}
      </h3>
      <p className="text-slate-700 text-sm sm:text-base leading-relaxed">
        {exam.about?.description}
      </p>
    </div>
{/* ABOUT TABLE */}
{exam.about?.about_table?.length >= 1 && (
  <div className="mt-6 overflow-x-auto">
    <table className="w-full border rounded-lg text-sm">
      <tbody>
        {exam.about.about_table.map((row, index) => (
          <tr
            key={index}
            className="border-b last:border-b-0"
          >
            <td className="px-4 py-3 bg-slate-50 font-medium text-slate-700 w-[35%]">
              {row.section}
            </td>
            <td className="px-4 py-3 text-slate-800">
              {row.detail}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)}

    {/* ELIGIBILITY */}
    <div className="bg-white p-6 sm:p-8 rounded-2xl border">
      <h3 className="text-lg sm:text-xl font-bold mb-4">
        Eligibility Criteria
      </h3>

      <div className="divide-y text-sm">
        {exam.eligibility?.basic_criteria?.map((e, i) => (
          <div
            key={i}
            className="flex justify-between py-3 gap-4"
          >
            <span className="text-slate-600">
              {e.particular}
            </span>
            <span className="font-semibold text-right">
              {e.detail}
            </span>
          </div>
        ))}
      </div>

      {exam.eligibility?.course_wise_eligibility?.length > 0 && (
        <div className="mt-6">
          <h4 className="font-semibold mb-3">
            Course-wise Eligibility
          </h4>

          <div className="space-y-2 text-sm text-slate-700">
            {exam.eligibility.course_wise_eligibility.map((c, i) => (
              <p key={i}>
                <strong>{c.course}:</strong> {c.criteria}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>

    {/* SYLLABUS */}
    <div className="bg-white p-6 sm:p-8 rounded-2xl border">
      <h3 className="text-lg sm:text-xl font-bold mb-4">
        Syllabus
      </h3>

      <div className="space-y-6">
        {exam.syllabus?.sections?.map((sec, i) => (
          <div key={i}>
            <h4 className="font-semibold text-base sm:text-lg mb-3">
              {sec.title}
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {sec.content.map((ch, j) => (
                <div
                  key={j}
                  className="bg-slate-50 p-4 rounded-lg border"
                >
                  <p className="font-medium mb-1">
                    {ch.chapter}
                  </p>

                  {ch.raw_text?.length > 0 && (
                    <ul className="list-disc pl-5 text-sm text-slate-600">
                      {ch.raw_text.map((t, k) => (
                        <li key={k}>{t}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* IMPORTANT DATES */}
    <div className="bg-white p-6 sm:p-8 rounded-2xl border">
      <h3 className="text-lg sm:text-xl font-bold mb-4">
        Important Dates
      </h3>

      <div className="space-y-3">
        {exam.important_dates?.map((d, i) => (
          <div
            key={i}
            className="
              flex justify-between items-center
              p-4 rounded-lg border
              bg-slate-50 text-sm
            "
          >
            <span className="text-slate-700">
              {d.session}
            </span>
            <span className="font-semibold">
              {d.exam_date || d.result_date}
            </span>
          </div>
        ))}
      </div>
    </div>
  </div>
 


  {/* ================= SIDEBAR ================= */}
  <aside className="space-y-6"> 
    <div className="hidden lg:block lg:sticky lg:top-[90px] space-y-6">
    {exam.highlights && (
  <div className="bg-white p-6 rounded-xl border">
    <h3 className="text-lg font-bold mb-4">
      Exam Highlights
    </h3>

    <div className="overflow-x-auto">
      <table className="w-full text-sm border rounded-lg">
        <tbody>

          <tr className="border-b">
            <td className="px-4 py-3 bg-slate-50 font-medium">
              Full Exam Name
            </td>
            <td className="px-4 py-3">
              {exam.highlights.full_exam_name}
            </td>
          </tr>

          <tr className="border-b">
            <td className="px-4 py-3 bg-slate-50 font-medium">
              Short Name
            </td>
            <td className="px-4 py-3">
              {exam.highlights.short_exam_name}
            </td>
          </tr>

          <tr className="border-b">
            <td className="px-4 py-3 bg-slate-50 font-medium">
              Conducting Body
            </td>
            <td className="px-4 py-3">
              {exam.highlights.conducting_body}
            </td>
          </tr>

          <tr className="border-b">
            <td className="px-4 py-3 bg-slate-50 font-medium">
              Exam Level
            </td>
            <td className="px-4 py-3">
              {exam.highlights.exam_level}
            </td>
          </tr>

          <tr className="border-b">
            <td className="px-4 py-3 bg-slate-50 font-medium">
              Frequency
            </td>
            <td className="px-4 py-3">
              {exam.highlights.frequency_of_conduct}
            </td>
          </tr>

          <tr className="border-b">
            <td className="px-4 py-3 bg-slate-50 font-medium">
              Mode of Application
            </td>
            <td className="px-4 py-3">
              {exam.highlights.mode_of_application}
            </td>
          </tr>

          <tr className="border-b">
            <td className="px-4 py-3 bg-slate-50 font-medium">
              Mode of Exam
            </td>
            <td className="px-4 py-3">
              {exam.highlights.mode_of_exam}
            </td>
          </tr>

          <tr className="border-b">
            <td className="px-4 py-3 bg-slate-50 font-medium">
              Counselling Mode
            </td>
            <td className="px-4 py-3">
              {exam.highlights.mode_of_counselling}
            </td>
          </tr>

          <tr className="border-b">
            <td className="px-4 py-3 bg-slate-50 font-medium">
              Exam Duration
            </td>
            <td className="px-4 py-3">
              {exam.highlights.exam_duration}
            </td>
          </tr>

          <tr className="border-b">
            <td className="px-4 py-3 bg-slate-50 font-medium">
              Participating Colleges
            </td>
            <td className="px-4 py-3 font-semibold">
              {exam.highlights.participating_colleges}
            </td>
          </tr>

          <tr>
            <td className="px-4 py-3 bg-slate-50 font-medium">
              Languages
            </td>
            <td className="px-4 py-3">
              {exam.highlights.languages?.join(", ")}
            </td>
          </tr>

        </tbody>
      </table>
    </div>
  </div>
)}

    {/* QUICK INFO */}
    <div className="bg-white p-5 sm:p-6 rounded-2xl border">
      <h4 className="font-bold mb-4">
        Quick Info
      </h4>

      <div className="space-y-3 text-sm">
        <div className="flex justify-between">
          <span className="text-slate-600">Exam Level</span>
          <span className="font-semibold">
            {exam.highlights?.exam_level}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-slate-600">Mode</span>
          <span className="font-semibold">
            {exam.highlights?.mode_of_exam}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-slate-600">Duration</span>
          <span className="font-semibold">
            {exam.highlights?.exam_duration}
          </span>
        </div>
      </div>
    </div>

    {/* UPCOMING DATES */}
    <div className="bg-white p-5 sm:p-6 rounded-2xl border">
      <h4 className="font-bold mb-4">
        Upcoming Dates
      </h4>

      <div className="space-y-3 text-sm">
        {exam.important_dates?.slice(0, 3).map((d, i) => (
          <div
            key={i}
            className="flex justify-between"
          >
            <span className="text-slate-700">
              {d.session}
            </span>
            <span className="font-semibold">
              {d.exam_date || d.result_date}
            </span>
          </div>
        ))}
      </div>
    </div> 
    </div>
  </aside>
</div>

    </div>
  );
};

export default ExamDetailPage;
