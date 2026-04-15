import React from "react";
import { Link, useLocation } from "react-router-dom";

/* ================= TYPES ================= */
interface FooterProps {
  exams?: any[];
  colleges?: any[];
  hideNewsletterOnMobile?: boolean;
}

const toSeoSlug = (value: string = "") =>
  value
    .toLowerCase()
    .trim()
    .replace(/\([^)]*\)/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

/* Must match ExamDetailPage's toExamSlug exactly */
const toExamSlug = (exam: any): string => {
  if (!exam?.name) return "";
  const slug = exam.name
    .toLowerCase()
    .replace(/\([^)]*\)/g, "")
    .replace(/[^\w\s]/g, "")
    .trim()
    .replace(/\s+/g, "-");
  return slug + (exam?.year ? `-${exam.year}` : "");
};

const getExamPath = (exam: any) => {
  const slug = toExamSlug(exam);
  return slug ? `/exams/${slug}` : "/exams";
};

const getCollegePath = (college: any) => {
  const collegeId = college?.id ? String(college.id).trim() : "";
  const nameSlug = toSeoSlug(college?.name || "");
  if (collegeId && nameSlug) return `/university/${collegeId}-${nameSlug}`;
  if (collegeId) return `/university/${collegeId}`;
  return "/colleges";
};

/* ================= SEO DATA ================= */
const STREAMS = [
  { id: "engineering", label: "Engineering" },
  { id: "management", label: "MBA" },
  { id: "medical", label: "Medical" },
  { id: "arts", label: "Arts & Science" },
  { id: "law", label: "Law" },
  { id: "design", label: "Design" },
];

const TOP_CITIES = [
  "Delhi", "Bangalore", "Mumbai", "Chennai", "Pune",
  "Hyderabad", "Ahmedabad", "Kolkata", "Noida", "Lucknow",
  "Jaipur", "Dehradun", "Coimbatore", "Chandigarh", "Bhopal",
];

const TOP_STATES = [
  "Maharashtra", "Karnataka", "Tamil Nadu", "Uttar Pradesh", "Rajasthan",
  "West Bengal", "Gujarat", "Telangana", "Andhra Pradesh", "Madhya Pradesh",
  "Punjab", "Bihar", "Kerala", "Uttarakhand", "Odisha",
];

/* Slugs verified against live /api/main-course-card — must match CourseDetailPage */
const TOP_COURSES = [
  { label: "MBA",    path: "/courses/management/master-of-business-administration-mba" },
  { label: "B.Tech", path: "/courses/engineering/bachelor-of-technology-btech" },
  { label: "MBBS",   path: "/courses/medical/bachelor-of-medicine-bachelor-of-surgery-mbbs" },
  { label: "BCA",    path: "/courses/computer-applications/bachelor-of-computer-applications-bca" },
  { label: "BBA",    path: "/courses/management/bachelor-of-business-administration-bba" },
  { label: "B.Com",  path: "/courses/commerce/bachelor-of-commerce-bcom" },
  { label: "B.Sc",   path: "/courses/science/bachelor-of-science-bsc" },
  { label: "BA",     path: "/courses/arts/bachelor-of-arts-ba" },
  { label: "M.Tech", path: "/courses/engineering/master-of-technology-mtech" },
  { label: "MCA",    path: "/courses/computer-applications/master-of-computer-applications-mca" },
  { label: "LLB",    path: "/courses/law/bachelor-of-laws-llb" },
  { label: "PGDM",   path: "/courses/management/post-graduate-diploma-in-management-pgdm" },
  { label: "B.Des",  path: "/courses/design/bachelor-of-design-bdes" },
  { label: "M.Des",  path: "/courses/design/master-of-design-mdes" },
];

/* Slugs verified against live API — must match ExamDetailPage toExamSlug */
const TOP_EXAMS_STATIC = [
  { name: "CAT 2025",              path: "/exams/cat-2025" },
  { name: "JEE Main 2026",         path: "/exams/jee-main-2026" },
  { name: "NEET 2026",             path: "/exams/neet-2026" },
  { name: "GATE 2026",             path: "/exams/gate-2026" },
  { name: "CUET UG 2026",          path: "/exams/cuet-ug-2026" },
  { name: "CLAT 2026",             path: "/exams/clat-2026" },
  { name: "NIFT Entrance Exam 2026", path: "/exams/nift-entrance-exam-2026" },
  { name: "BITSAT 2026",           path: "/exams/bitsat-2026" },
  { name: "JEE Advanced 2026",     path: "/exams/jee-advanced-2026" },
  { name: "VITEEE 2026",           path: "/exams/viteee-2026" },
];

/* ================= FOOTER ================= */
const Footer: React.FC<FooterProps> = ({
  exams = [],
  colleges = [],
}) => {
  const [activeStream, setActiveStream] = React.useState("engineering");
  const examList = Array.isArray(exams) ? exams : [];
  const collegeList = Array.isArray(colleges) ? colleges : [];

  return (
    <>
      <div className="bg-slate-100 px-4 py-8">
        <footer className="bg-white border border-slate-200 rounded-3xl overflow-hidden">

          {/* ── SEO KEYWORDS MEGA SECTION ── */}
          <div className="bg-[#f8faff] border-b border-slate-100 px-6 py-8">
            <div className="max-w-7xl mx-auto">

              {/* Stream tabs */}
              <div className="flex flex-wrap gap-2 mb-6">
                {STREAMS.map(s => (
                  <button
                    key={s.id}
                    onClick={() => setActiveStream(s.id)}
                    className={`px-4 py-1.5 rounded-full text-[12px] font-semibold border transition-all ${
                      activeStream === s.id
                        ? "bg-[#1E4A7A] text-white border-[#1E4A7A]"
                        : "bg-white text-slate-600 border-slate-200 hover:border-[#1E4A7A] hover:text-[#1E4A7A]"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              {/* Colleges by city + state grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* By City */}
                <div>
                  <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-3">
                    📍 Top {STREAMS.find(s => s.id === activeStream)?.label} Colleges by City
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                    {TOP_CITIES.map(city => (
                      <Link
                        key={city}
                        to={`/${activeStream}/top-colleges-in-${toSeoSlug(city)}`}
                        className="text-[12px] text-slate-600 hover:text-[#1E4A7A] hover:underline leading-snug"
                      >
                        {STREAMS.find(s => s.id === activeStream)?.label} Colleges in {city}
                      </Link>
                    ))}
                  </div>
                </div>

                {/* By State */}
                <div>
                  <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-3">
                    🗺️ Top {STREAMS.find(s => s.id === activeStream)?.label} Colleges by State
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                    {TOP_STATES.map(state => (
                      <Link
                        key={state}
                        to={`/${activeStream}/top-colleges-in-${toSeoSlug(state)}`}
                        className="text-[12px] text-slate-600 hover:text-[#1E4A7A] hover:underline leading-snug"
                      >
                        {STREAMS.find(s => s.id === activeStream)?.label} Colleges in {state}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── MAIN FOOTER LINKS ── */}
          <div className="max-w-7xl mx-auto px-6 py-8">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">

              {/* BRAND */}
              <div className="col-span-2 lg:col-span-1 space-y-4">
                <img src="/logos/StudyCups.png" alt="StudyCups — Best Colleges in India 2026" className="h-9 w-auto" />
                <p className="text-[12px] text-slate-500 leading-relaxed">
                  India's trusted platform to discover colleges, courses &amp; exams. Compare fees, rankings &amp; admissions for 2026.
                </p>
                <div className="space-y-1 text-[12px]">
                  <Link to="/free-counselling" className="block text-blue-600 hover:underline">Free Counselling</Link>
                  <Link to="/coming-soon" className="block text-blue-600 hover:underline">About Us</Link>
                  <a href="https://www.termsfeed.com/live/417bdd06-e677-4181-b70f-efa4edb0e654" target="_blank" rel="noopener noreferrer" className="block text-blue-600 hover:underline">Privacy Policy</a>
                  <a href="https://www.termsfeed.com/live/417bdd06-e677-4181-b70f-efa4edb0e654" target="_blank" rel="noopener noreferrer" className="block text-blue-600 hover:underline">Terms &amp; Conditions</a>
                </div>
              </div>

              {/* POPULAR COURSES */}
              <div>
                <h4 className="text-[12px] font-bold text-slate-800 mb-3 uppercase tracking-wide">📚 Popular Courses</h4>
                <ul className="space-y-1.5">
                  {TOP_COURSES.map(course => (
                    <li key={course.path}>
                      <Link to={course.path} className="text-[12px] text-slate-600 hover:text-blue-600 hover:underline">
                        {course.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* ENTRANCE EXAMS */}
              <div>
                <h4 className="text-[12px] font-bold text-slate-800 mb-3 uppercase tracking-wide">📝 Entrance Exams</h4>
                <ul className="space-y-1.5">
                  {(examList.length > 0 ? examList.slice(0, 10) : TOP_EXAMS_STATIC).map((exam: any) => (
                    <li key={exam.id ?? exam.name ?? exam.path}>
                      <Link
                        to={exam.path ?? getExamPath(exam)}
                        className="text-[12px] text-slate-600 hover:text-blue-600 hover:underline"
                      >
                        {exam.name}
                      </Link>
                    </li>
                  ))}
                  <li><Link to="/exams" className="text-[12px] text-blue-600 font-semibold hover:underline">View All Exams →</Link></li>
                </ul>
              </div>

              {/* TOP COLLEGES */}
              <div>
                <h4 className="text-[12px] font-bold text-slate-800 mb-3 uppercase tracking-wide">🏛️ Top Colleges</h4>
                <ul className="space-y-1.5">
                  {collegeList.slice(0, 8).map(college => (
                    <li key={college.id ?? college.name}>
                      <Link to={getCollegePath(college)} className="text-[12px] text-slate-600 hover:text-blue-600 hover:underline leading-snug block">
                        {college.name}
                      </Link>
                    </li>
                  ))}
                  <li><Link to="/colleges" className="text-[12px] text-blue-600 font-semibold hover:underline">View All Colleges →</Link></li>
                </ul>
              </div>

              {/* STREAM LINKS */}
              <div>
                <h4 className="text-[12px] font-bold text-slate-800 mb-3 uppercase tracking-wide">🎓 By Stream</h4>
                <ul className="space-y-1.5">
                  {STREAMS.map(s => (
                    <li key={s.id}>
                      <Link to={`/${s.id}/top-colleges`} className="text-[12px] text-slate-600 hover:text-blue-600 hover:underline">
                        Top {s.label} Colleges
                      </Link>
                    </li>
                  ))}
                  <li className="pt-1 border-t border-slate-100">
                    <Link to="/college-predictor" className="text-[12px] text-orange-600 hover:underline font-semibold">🎯 College Predictor</Link>
                  </li>
                  <li>
                    <Link to="/compare" className="text-[12px] text-orange-600 hover:underline font-semibold">⚖️ Compare Colleges</Link>
                  </li>
                  <li>
                    <Link to="/nirf-insights" className="text-[12px] text-orange-600 hover:underline font-semibold">🏆 NIRF Rankings</Link>
                  </li>
                </ul>
              </div>

              {/* QUICK LINKS */}
              <div>
                <h4 className="text-[12px] font-bold text-slate-800 mb-3 uppercase tracking-wide">🔗 Quick Links</h4>
                <ul className="space-y-1.5">
                  {[
                    ["Best MBA Colleges in India", "/management/top-colleges"],
                    ["Best Engineering Colleges", "/engineering/top-colleges"],
                    ["Best Medical Colleges", "/medical/top-colleges"],
                    ["Top Law Colleges in India", "/law/top-colleges"],
                    ["Best Design Colleges", "/design/top-colleges"],
                    ["MBA Colleges in Delhi", "/management/top-colleges-in-delhi"],
                    ["Engineering Colleges in Bangalore", "/engineering/top-colleges-in-bangalore"],
                    ["MBA Colleges in Mumbai", "/management/top-colleges-in-mumbai"],
                    ["Medical Colleges in Chennai", "/medical/top-colleges-in-chennai"],
                    ["AI College Finder", "/ai-college-finder"],
                  ].map(([label, path]) => (
                    <li key={path}>
                      <Link to={path} className="text-[12px] text-slate-600 hover:text-blue-600 hover:underline leading-snug block">
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* ── SEO KEYWORD STRIP (hidden visually but crawlable) ── */}
          <div className="border-t border-slate-100 bg-slate-50 px-6 py-4">
            <div className="max-w-7xl mx-auto">
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-widest mb-2">Popular Searches</p>
              <div className="flex flex-wrap gap-x-3 gap-y-1">
                {[
                  ["Best MBA Colleges in India 2026", "/management/top-colleges"],
                  ["Top Engineering Colleges in India", "/engineering/top-colleges"],
                  ["Best Medical Colleges 2026", "/medical/top-colleges"],
                  ["MBA Colleges in Delhi", "/management/top-colleges-in-delhi"],
                  ["MBA Colleges in Mumbai", "/management/top-colleges-in-mumbai"],
                  ["MBA Colleges in Bangalore", "/management/top-colleges-in-bangalore"],
                  ["MBA Colleges in Pune", "/management/top-colleges-in-pune"],
                  ["Engineering Colleges in Delhi", "/engineering/top-colleges-in-delhi"],
                  ["Engineering Colleges in Bangalore", "/engineering/top-colleges-in-bangalore"],
                  ["Engineering Colleges in Mumbai", "/engineering/top-colleges-in-mumbai"],
                  ["Engineering Colleges in Chennai", "/engineering/top-colleges-in-chennai"],
                  ["MBBS Colleges in India", "/medical/top-colleges"],
                  ["Medical Colleges in Maharashtra", "/medical/top-colleges-in-maharashtra"],
                  ["MBA Colleges in Maharashtra", "/management/top-colleges-in-maharashtra"],
                  ["Law Colleges in India", "/law/top-colleges"],
                  ["Design Colleges in India", "/design/top-colleges"],
                  ["Top Colleges in Karnataka", "/management/top-colleges-in-karnataka"],
                  ["Top Colleges in Tamil Nadu", "/engineering/top-colleges-in-tamil-nadu"],
                  ["CAT 2025 Exam", "/exams/cat-2025"],
                  ["JEE Main 2026", "/exams/jee-main-2026"],
                  ["NEET 2026 Exam", "/exams/neet-2026"],
                  ["College Predictor 2026", "/college-predictor"],
                ].map(([label, path]) => (
                  <Link key={path} to={path} className="text-[11px] text-slate-500 hover:text-blue-600 whitespace-nowrap">
                    {label}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* ── BOTTOM BAR ── */}
          <div className="border-t border-slate-200 py-4">
            <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-2 text-slate-500 text-[12px]">
              <p>© 2026 StudyCups — Best Colleges, Courses &amp; Exams in India</p>
              <p>
                Helpdesk: <a href="tel:+918081269969" className="font-semibold hover:text-blue-600">+91 8081269969</a>
                &nbsp;|&nbsp;
                <a href="tel:05124061386" className="font-semibold hover:text-blue-600">0512-4061386</a>
              </p>
            </div>
          </div>

        </footer>
      </div>
    </>
  );
};

export default Footer;
