import React from "react";
import { Link } from "react-router-dom";

/* ================= TYPES ================= */
interface FooterProps {
  exams?: any[];
  colleges?: any[];
} 
const getCollegeSlug = (college: any) => {
  if (college.slugId) return college.slugId;
  if (college.slug && college.id) return `${college.slug}--${college.id}`;
  if (college.name && college.id)
    return `${college.name.toLowerCase().replace(/\s+/g, "-")}--${college.id}`;
  return "";
};


/* ================= NEWSLETTER ================= */
const Newsletter = () => {
  return (
    <div className="relative z-20 -mb-24">
      <div className="max-w-7xl mx-auto px-4">
        <div
          className="
            bg-[#0B2C4D]
            rounded-t-[36px]
            px-6 md:px-14
            py-12 md:py-16
            text-white
            shadow-[0_-18px_40px_rgba(0,0,0,0.25)]
          "
        >
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-[40px] font-extrabold leading-tight">
              Subscribe To Our News Letter
            </h2>
            <p className="mt-2 text-sm md:text-base text-white/80">
              Get Colleges Notification, Alerts, Exams Update and more....
            </p>
          </div>

          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="flex items-center bg-white rounded-xl px-4 h-12">
                <span className="mr-2 text-slate-400">✉</span>
                <input
                  type="email"
                  placeholder="Enter your Email id"
                  className="w-full text-sm text-slate-700 outline-none"
                />
              </div>

              <div className="flex items-center bg-white rounded-xl px-4 h-12">
                <span className="mr-2 text-slate-400">📞</span>
                <input
                  type="tel"
                  placeholder="Enter Your Mobile no"
                  className="w-full text-sm text-slate-700 outline-none"
                />
              </div>

              <select className="bg-white rounded-xl h-12 px-4 text-sm text-slate-600 outline-none">
                <option>Search Courses</option>
                <option>Engineering</option>
                <option>Management</option>
                <option>Medical</option>
                <option>Design</option>
              </select>

              <button className="bg-green-500 transition text-white font-semibold rounded-xl h-12">
                Submit
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ================= FOOTER ================= */
const Footer: React.FC<FooterProps> = ({
  exams = [],
  colleges = [],
}) => {
  /* ✅ NORMALIZE DATA (CRITICAL FIX) */
  const examList = Array.isArray(exams) ? exams : [];
  const collegeList = Array.isArray(colleges) ? colleges : [];

  return (
    <>
      <Newsletter />
  
      <div className="bg-slate-100 px-4 py-16">
      <footer className="bg-white border-t border-slate-200 pt-32  rounded-4xl">
        <div className="max-w-7xl mx-auto px-6 pb-8 rounded-4xl">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-x-10 gap-y-6">

            {/* BRAND */}
            <div className="col-span-2 space-y-4">
              <img src="/logos/StudyCups.png" alt="StudyCups" className="h-10" />

              <p className="text-sm text-slate-600 leading-relaxed max-w-sm">
                Empowering students to discover the right colleges, courses,
                exams, and career paths with confidence.
              </p>

              <div className="space-y-1 text-sm">
                <Link to="/" className="block text-blue-600 hover:underline">About StudyCups</Link>
                <Link to="/" className="block text-blue-600 hover:underline">Contact Us</Link>
                <Link to="https://www.termsfeed.com/live/417bdd06-e677-4181-b70f-efa4edb0e654" className="block text-blue-600 hover:underline">Terms & Conditions</Link>
                <Link to="https://www.termsfeed.com/live/417bdd06-e677-4181-b70f-efa4edb0e654" className="block text-blue-600 hover:underline">Privacy Policy</Link>
                <Link to="/" className="block text-blue-600 hover:underline">Disclaimer</Link>
              </div>
            </div>

            {/* EXPLORE EXAMS */}
            <div>
              <h4 className="text-sm font-semibold mb-3">Explore Exams</h4>
              <ul className="space-y-1.5 text-sm text-slate-600">
                {examList.slice(0, 6).map((exam) => (
                  <li key={exam._id}>
                    <Link
                      to={`/exam/${exam.id}`}
                      className="hover:text-blue-600"
                    >
                      {exam.name}
                    </Link>
                  </li>
                ))}

                {examList.length === 0 && (
                  <li className="text-slate-400">Loading exam</li>
                )}

                <li>
                  <Link to="/exams" className="text-blue-600 font-medium">
                    View All Exams
                  </Link>
                </li>
              </ul>
            </div>

            {/* TOP COLLEGES */}
            <div>
              <h4 className="text-sm font-semibold mb-3">Top Colleges</h4>
             <ul className="space-y-2 text-sm text-slate-600">

                {collegeList.slice(0, 5).map((college) => (
              <Link
  to={`/college/${getCollegeSlug(college)}`}
  className="
    block
    leading-snug
    break-words
    whitespace-normal
    hover:text-blue-600
  "
>
  {college.name}
</Link>



                ))}

                <li>
                  <Link to="/colleges" className="text-blue-600 font-medium">
                    View All Colleges
                  </Link>
                </li>
              </ul>
            </div>

            {/* STUDY STREAMS */}
            <div>
              <h4 className="text-sm font-semibold mb-3">Study Streams</h4>
              <ul className="space-y-1.5 text-sm text-slate-600">
                {[
                  "Engineering",
                  "Management",
                  "Medical",
                  "Design",
                  "IT & Software",
                  "Law",
                ].map((stream) => (
                  <li key={stream}>
                    <Link
                      to={`/courses?stream=${encodeURIComponent(stream)}`}
                      className="hover:text-blue-600"
                    >
                      {stream}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

          </div>
        </div>

        {/* BOTTOM BAR */}
        <div className="border-t border-slate-200 py-4 text-sm rounded-4xl">
          <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-2 text-slate-600">
            <p>© 2026 StudyCups</p>
            <p>
              Regular Helpdesk: <strong>+91 8081269969</strong> | Online Helpdesk:{" "}
              <strong>+91 7753831118</strong>
            </p>
          </div>
        </div>
      </footer>
      </div>
    </>
  );
};

export default Footer;
