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

const getExamPath = (exam: any) => {
  const examSlug =
    toSeoSlug(exam?.name || "") + (exam?.year ? `-${exam.year}` : "");

  return examSlug ? `/exams/${examSlug}` : "/exams";
};

const getCollegePath = (college: any) => {
  const collegeId = college?.id ? String(college.id).trim() : "";
  const nameSlug = toSeoSlug(college?.name || "");

  if (collegeId && nameSlug) {
    return `/university/${collegeId}-${nameSlug}`;
  }

  if (collegeId) {
    return `/university/${collegeId}`;
  }

  return "/colleges";
};

/* ================= NEWSLETTER ================= */
const Newsletter: React.FC<{ hideOnMobile?: boolean }> = ({ hideOnMobile = false }) => {
  return (
    <div className={`relative z-20 -mb-24 ${hideOnMobile ? "hidden md:block" : ""}`}>
      <div className="max-w-7xl mx-auto px-4">
        <div
          className="
            bg-[#1E4A7A]
            rounded-t-[36px]
            px-5 md:px-10
            py-8 md:py-10
            text-white
            shadow-[0_-18px_40px_rgba(0,0,0,0.20)]
          "
        >
          <div className="max-w-3xl mx-auto text-center">
            <p className="inline-flex items-center rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[10px] md:text-[11px] font-semibold tracking-[0.12em]">
              TALK TO US TODAY - IT'S FREE
            </p>

            <h2 className="mt-4 text-2xl md:text-[44px] leading-[1.1] font-semibold font-serif">
              Start Your Admission Journey Now
            </h2>

            <p className="mt-3 max-w-2xl mx-auto text-sm md:text-lg text-white/90">
              Book a free 30-minute counselling call. Our experts are ready to
              help you find the right college, right now.
            </p>

            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-2.5">
              <a
                href="tel:+918081269969"
                className="inline-flex items-center gap-2 rounded-full bg-white text-[#0f747f] px-6 py-2.5 text-sm md:text-base font-semibold shadow-[0_10px_25px_rgba(0,0,0,0.16)]"
              >
                <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-[#f06292]/20">
                  <span className="h-2 w-2 rounded-full bg-[#f06292]" />
                </span>
                Call 8081269969
              </a>

              <a
                href="https://wa.me/918081269969"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-6 py-2.5 text-sm md:text-base font-semibold text-white"
              >
                <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-white/20">
                  <span className="h-2 w-2 rounded-full bg-white" />
                </span>
                WhatsApp Us
              </a>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 text-sm text-white/90">
              <span className="inline-flex items-center gap-2">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-white/70" />
                support@studycups.in
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-white/70" />
                0512-4061386
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-white/70" />
                Kanpur & New Delhi
              </span>
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
  hideNewsletterOnMobile = false,
}) => {
  const location = useLocation();
  /* âœ… NORMALIZE DATA (CRITICAL FIX) */
  const examList = Array.isArray(exams) ? exams : [];
  const collegeList = Array.isArray(colleges) ? colleges : [];
  const pathname = location.pathname.toLowerCase();
  const hideNewsletter =
    pathname === "/colleges" ||
    pathname.startsWith("/courses") ||
    pathname.startsWith("/university/") ||
    pathname.includes("top-colleges");

  return (
    <>
      {!hideNewsletter && <Newsletter hideOnMobile={hideNewsletterOnMobile} />}

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
                  <Link to="/" className="block text-blue-600 hover:underline">
                    About StudyCups
                  </Link>
                  <Link to="/" className="block text-blue-600 hover:underline">
                    Contact Us
                  </Link>
                  <Link
                    to="https://www.termsfeed.com/live/417bdd06-e677-4181-b70f-efa4edb0e654"
                    className="block text-blue-600 hover:underline"
                  >
                    Terms & Conditions
                  </Link>
                  <Link
                    to="https://www.termsfeed.com/live/417bdd06-e677-4181-b70f-efa4edb0e654"
                    className="block text-blue-600 hover:underline"
                  >
                    Privacy Policy
                  </Link>
                  <Link to="/" className="block text-blue-600 hover:underline">
                    Disclaimer
                  </Link>
                </div>
              </div>

              {/* EXPLORE EXAMS */}
              <div>
                <h4 className="text-sm font-semibold mb-3">Explore Exams</h4>
                <ul className="space-y-1.5 text-sm text-slate-600">
                  {examList.slice(0, 6).map((exam) => (
                    <li key={exam.id ?? exam._id ?? exam.name}>
                      <Link to={getExamPath(exam)} className="hover:text-blue-600">
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
                    <li key={college.id ?? college.name}>
                      <Link
                        to={getCollegePath(college)}
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
                    </li>
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
              <p>Â© 2026 StudyCups</p>
              <p>
                Regular Helpdesk: <strong>+91 8081269969</strong> | Online Helpdesk:{" "}
                <strong>0512-4061386</strong>
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default Footer;
