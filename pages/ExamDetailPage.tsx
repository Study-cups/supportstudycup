import React, { useState, useEffect } from "react";
import type { View } from "../types";
import { useParams, useNavigate } from "react-router-dom";

interface ExamDetailPageProps {
  examId: number;
  setView: (view: View) => void;
}

const ExamDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const examId = Number(id);

  const [exam, setExam] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("Overview");
  const [loading, setLoading] = useState(true);

  const tabs = ["Overview", "Eligibility", "Syllabus", "Important Dates"];

  /* ================= FETCH ================= */
  useEffect(() => {
    const fetchExam = async () => {
      try {
        const res = await fetch(`https://studycupsbackend-wb8p.onrender.com/api/exams/${examId}`);
        const json = await res.json();
        if (json.success) setExam(json.data);
      } catch (e) {
        console.error("Exam API Error", e);
      } finally {
        setLoading(false);
      }
    };
    fetchExam();
  }, [examId]);

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
 const highlightRows = exam.highlights
  ? Object.entries(exam.highlights).filter(
      ([_, value]) => value !== null && value !== ""
    )
  : [];

  

  /* ================= UI ================= */
  return (
    <div className="bg-slate-20">
      {/* HERO */}
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
    <div className="hidden lg:block lg:sticky lg:top-[20px] space-y-6">
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
