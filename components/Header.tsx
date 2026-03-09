import React, { useState , useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import type { College } from "../types";



interface HeaderProps {
  colleges: College[];
  exams: any[];
  onOpenApplyNow: () => void;
}

const toSeoSlug = (text: string) =>
  text
    .toLowerCase()
    .trim()
    .replace(/\([^)]*\)/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-"); 

const Header: React.FC<HeaderProps> = ({ onOpenApplyNow  , colleges ,exams}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const [showCoursesMenu, setShowCoursesMenu] = useState(false);
  const [showCollegesMenu, setShowCollegesMenu] = useState(false);
  // ===== MEGA MENU STATE =====
const [menuCourses, setMenuCourses] = useState<any[]>([]);
const [menuColleges, setMenuColleges] = useState<any[]>([]);
const [menuExams, setMenuExams] = useState<any[]>([]);
const [collegeMenuColleges, setCollegeMenuColleges] = useState<any[]>([]);
const [collegeMenuCourses, setCollegeMenuCourses] = useState<any[]>([]);
const [collegeMenuExams, setCollegeMenuExams] = useState<any[]>([]);
const [loadingMenu, setLoadingMenu] = useState(false);

// simple cache to avoid repeat calls
const hoverCache = React.useRef<Record<string, any>>({});


  const location = useLocation();
 const activePage = location.pathname; 

const COURSE_REGEX_MAP: Record<string, RegExp> = {
  "B.E / B.Tech": /(b\.?\s?tech|bachelor of technology|b\.?\s?e)/i,
  "MBA / PGDM": /(mba|pgdm|post graduate|management)/i,
  "MBBS": /(mbbs|medicine)/i,
  "BCA": /(bca|computer application)/i,
  "B.Com": /(b\.?\s?com|commerce)/i,
  "B.Sc": /(b\.?\s?sc|bs|bachelor of science)/i,
  "BA": /(b\.?\s?a|bachelor of arts)/i,
  "BBA": /(bba|business administration)/i,
  "M.E / M.Tech": /(m\.?\s?tech|master of technology|m\.?\s?e)/i,
  "MCA": /(mca|computer application)/i,
  "B.Ed": /(b\.?\s?ed|education)/i,
};
const COURSE_EXAM_MAP: Record<string, string[]> = {
  "MBA / PGDM": ["CAT", "XAT", "CMAT", "MAT", "GMAT"],
  "B.E / B.Tech": ["JEE Main", "JEE Advanced", "GATE"],
  "MBBS": ["NEET"],
  "BCA": ["CUET"],
  "B.Com": ["CUET"],
  "B.Sc": ["CUET"],
  "BA": ["CUET"],
  "BBA": ["CUET"],
  "M.E / M.Tech": ["GATE"],
  "MCA": ["NIMCET"],
  "B.Ed": ["CUET"],
};
const COURSE_CATEGORY_MAP: Record<string, string> = {
  "B.E / B.Tech": "engineering",
  "MBA / PGDM": "management",
  "MBBS": "medical",
  "BCA": "engineering",
  "B.Com": "commerce",
  "B.Sc": "science",
  "BA": "arts",
  "BBA": "management",
  "M.E / M.Tech": "engineering",
  "MCA": "engineering",
  "B.Ed": "education",
};

const getExamsForCourse = (courseName: string) => {
  const allowedExams = COURSE_EXAM_MAP[courseName];
  if (!allowedExams || !Array.isArray(exams)) return [];

  return exams
    .filter((exam: any) =>
      allowedExams.some(key =>
        exam.name?.toLowerCase().includes(key.toLowerCase())
      )
    )
    .map((exam: any) => ({
      id: exam.id,
      name: exam.name,
      year: exam.year,
    }));
};



const [activeCourse, setActiveCourse] = useState<{
  name: string;
  stream: string;
} | null>(null);  
const [activeCollege, setActiveCollege] = useState<any | null>(null);
const collegeLookupById = useMemo(() => {
  const resultMap = new Map<number, any>();

  colleges.forEach((college: any) => {
    if (!college?.id || resultMap.has(college.id)) return;
    resultMap.set(college.id, college);
  });

  return resultMap;
}, [colleges]);

const allMenuColleges = useMemo(() => {
  const resultMap = new Map<number, any>();

  colleges.forEach((college: any) => {
    if (!college?.id || !college?.name || resultMap.has(college.id)) return;

    resultMap.set(college.id, {
      id: college.id,
      name: college.name,
      logoUrl: college.logoUrl,
    });
  });

  return Array.from(resultMap.values());
}, [colleges]);

const allMenuExams = useMemo(() => {
  const resultMap = new Map<string | number, any>();

  if (!Array.isArray(exams)) return [];

  exams.forEach((exam: any) => {
    const examKey = exam?.id ?? `${exam?.name}-${exam?.year ?? ""}`;
    if (!exam?.name || resultMap.has(examKey)) return;

    resultMap.set(examKey, {
      id: exam.id,
      name: exam.name,
      year: exam.year,
    });
  });

  return Array.from(resultMap.values());
}, [exams]);

const getMenuCourses = () => {
  return Object.keys(COURSE_REGEX_MAP).map(name => ({
    name,
    stream: COURSE_CATEGORY_MAP[name] || "general",
  }));
};

const getMatchableCourseValues = (college: any) => {
  const rawCourses = Array.isArray(college?.rawScraped?.courses)
    ? college.rawScraped.courses
    : [];
  const listedCourses = Array.isArray(college?.courses) ? college.courses : [];
  const fullTimeCourses = Array.isArray(college?.rawScraped?.courses_full_time)
    ? college.rawScraped.courses_full_time
    : [];

  return [
    college?.stream,
    ...rawCourses.map((course: any) => course?.name || course?.course_name),
    ...listedCourses.map((course: any) => course?.name || course?.course_name),
    ...fullTimeCourses.map(
      (course: any) => course?.name || course?.course_name || course?.title
    ),
  ].filter((value): value is string => typeof value === "string" && value.trim().length > 0);
};

React.useEffect(() => {
  if (!showCoursesMenu) return;

  // frontend se hi courses set karo
  setMenuCourses(getMenuCourses());
  setActiveCourse(null);
  setMenuColleges(allMenuColleges);
  setMenuExams(allMenuExams);
}, [showCoursesMenu, allMenuColleges, allMenuExams]);

React.useEffect(() => {
  if (!showCollegesMenu) return;

  setActiveCollege(null);
  setCollegeMenuColleges(allMenuColleges);
  setCollegeMenuCourses(getMenuCourses());
  setCollegeMenuExams(allMenuExams);
}, [showCollegesMenu, allMenuColleges, allMenuExams]);

const getCollegesForCourse = (courseName: string) => {
  const regex = COURSE_REGEX_MAP[courseName];
  if (!regex) return [];

  const resultMap = new Map<number, any>();

  colleges.forEach((college: any) => {
    const matchableValues = getMatchableCourseValues(college);

    const matched = matchableValues.some((value) => regex.test(value.toLowerCase()));

    if (matched && !resultMap.has(college.id)) {
      resultMap.set(college.id, {
        id: college.id,
        name: college.name,
        logoUrl: college.logoUrl,
      });
    }
  });

  return Array.from(resultMap.values());
};

const getCoursesForCollege = (college: any) => {
  const matchableValues = getMatchableCourseValues(college);
  const matchedCourses = getMenuCourses().filter((course) =>
    matchableValues.some((value) =>
      COURSE_REGEX_MAP[course.name]?.test(value.toLowerCase())
    )
  );

  const uniqueCourses = matchedCourses.filter(
    (course, index, array) => array.findIndex((item) => item.name === course.name) === index
  );

  if (uniqueCourses.length > 0) {
    return uniqueCourses;
  }

  if (typeof college?.stream === "string" && college.stream.trim()) {
    return [
      {
        name: college.stream.trim(),
        stream: COURSE_CATEGORY_MAP[college.stream.trim()] || "general",
      },
    ];
  }

  return [];
};

const getExamsForCollege = (college: any) => {
  const resultMap = new Map<string | number, any>();

  getCoursesForCollege(college).forEach((course) => {
    getExamsForCourse(course.name).forEach((exam) => {
      const examKey = exam?.id ?? `${exam?.name}-${exam?.year ?? ""}`;
      if (resultMap.has(examKey)) return;

      resultMap.set(examKey, exam);
    });
  });

  return Array.from(resultMap.values());
};





const handleCourseHover = (course: { name: string; stream: string }) => {
  setActiveCourse(course);

  const collegesMatched = getCollegesForCourse(course.name); 
  const examsMatched = getExamsForCourse(course.name); // ✅ ADD 


  setMenuColleges(collegesMatched);
  setMenuExams(examsMatched); // ✅ ADD 
};

const handleCollegeHover = (college: any) => {
  const sourceCollege = collegeLookupById.get(college?.id) || college;

  setActiveCollege(sourceCollege);
  setCollegeMenuCourses(getCoursesForCollege(sourceCollege));
  setCollegeMenuExams(getExamsForCollege(sourceCollege));
};

 const tabClass = (path: string) =>
  `relative pb-1 transition ${
    activePage === path
      ? "text-[#0F2D52] font-bold after:absolute after:left-0 after:bottom-0 after:h-[2px] after:w-full after:bg-[#0F2D52]"
      : "text-[#0F2D52] hover:text-[#062042]"
  }`;
const CoursesMegaMenu = () => {
  return (
    <div
      className="
        absolute left-1/2 top-full mt-4
        -translate-x-1/2
        w-[1000px]
        bg-white
        rounded-2xl
        shadow-[0_25px_60px_rgba(0,0,0,0.18)]
        border border-slate-200
        z-50
        p-6
      "
    >
      <div className="grid grid-cols-4 gap-6">

        {/* COURSES */}
        <div>
          <p className="font-bold text-[#0F2D52] mb-3">Courses</p>

          <div className="max-h-[360px] overflow-y-auto pr-1">
            {menuCourses.map(course => (
              <p
                key={course.name}
                onMouseEnter={() => handleCourseHover(course)} 
                
               onClick={() =>
    navigate(
    `/courses/${course.stream}/${toSeoSlug(course.name)}`
  )
  }

                className={`text-sm py-1.5 cursor-pointer ${
                  activeCourse?.name === course.name
                    ? "text-[#1E4A7A] font-semibold"
                    : "text-slate-700 hover:text-[#1E4A7A]"
                }`}
              >
                {course.name}
              </p>
            ))}
          </div>

          <button
            onClick={() => navigate("/courses")}
            className="mt-3 text-sm text-blue-600 font-semibold"
          >
            View All Courses →
          </button>
        </div>

        {/* COLLEGES */}
        <div>
          <p className="font-bold text-[#0F2D52] mb-3">
            {activeCourse ? "Colleges" : "All Colleges"}
          </p>

          <div className="max-h-[360px] overflow-y-auto pr-1">
            {menuColleges.length > 0 ? (
              menuColleges.map(college => (
                <p
                  key={college.id}
               onClick={() =>
      navigate(
        `/university/${college.id}-${toSeoSlug(college.name)}`
      )
    }

                  className="text-sm text-slate-700 py-1.5 cursor-pointer hover:text-[#1E4A7A]"
                >
                  {college.name}
                </p>
              ))
            ) : (
              <p className="text-sm text-slate-500">No colleges found</p>
            )}
          </div>
        </div>

        {/* EXAMS */}
        <div>
          <p className="font-bold text-[#0F2D52] mb-3">
            {activeCourse ? "Exams" : "All Exams"}
          </p>

          <div className="max-h-[360px] overflow-y-auto pr-1">
            {menuExams.length > 0 ? (
              menuExams.map(exam => (
                <p
                  key={exam.id}
                 onClick={() =>
      navigate(`/exams/${toSeoSlug(exam.name)}${exam.year ? `-${exam.year}` : ""}`)
    }

                  className="text-sm text-slate-700 py-1.5 cursor-pointer hover:text-[#1E4A7A]"
                >
                  {exam.name}
                </p>
              ))
            ) : (
              <p className="text-sm text-slate-500">No exams found</p>
            )}
          </div>
        </div>

        {/* CTA */}
        <div className="bg-slate-50 rounded-xl p-4">
          <p className="font-bold text-[#0F2D52] mb-2">
            College Predictor
          </p>
          <p className="text-xs text-slate-600 mb-3">
            Predict colleges based on your rank & score
          </p>
          <button
            onClick={() => navigate("/compare")}
            className="w-full bg-[#1E4A7A] text-white py-2 rounded-lg text-sm font-semibold hover:bg-[#163a63]"
          >
            Try Predictor →
          </button>
        </div>

      </div>
    </div>
  );
};

const CollegesMegaMenu = () => {
  return (
    <div
      className="
        absolute left-1/2 top-full mt-4
        -translate-x-1/2
        w-[860px]
        bg-white
        rounded-2xl
        shadow-[0_25px_60px_rgba(0,0,0,0.18)]
        border border-slate-200
        z-50
        p-6
      "
    >
      <div className="grid grid-cols-3 gap-6">
        <div>
          <p className="font-bold text-[#0F2D52] mb-3">Colleges</p>

          <div className="max-h-[360px] overflow-y-auto pr-1">
            {collegeMenuColleges.length > 0 ? (
              collegeMenuColleges.map((college) => (
                <p
                  key={college.id}
                  onMouseEnter={() => handleCollegeHover(college)}
                  onClick={() =>
                    navigate(`/university/${college.id}-${toSeoSlug(college.name)}`)
                  }
                  className={`text-sm py-1.5 cursor-pointer ${
                    activeCollege?.id === college.id
                      ? "text-[#1E4A7A] font-semibold"
                      : "text-slate-700 hover:text-[#1E4A7A]"
                  }`}
                >
                  {college.name}
                </p>
              ))
            ) : (
              <p className="text-sm text-slate-500">No colleges found</p>
            )}
          </div>

          <button
            onClick={() => navigate("/colleges")}
            className="mt-3 text-sm text-blue-600 font-semibold"
          >
            View All Colleges
          </button>
        </div>

        <div>
          <p className="font-bold text-[#0F2D52] mb-3">
            {activeCollege ? "Related Courses" : "All Courses"}
          </p>

          <div className="max-h-[360px] overflow-y-auto pr-1">
            {collegeMenuCourses.length > 0 ? (
              collegeMenuCourses.map((course) => (
                <p
                  key={course.name}
                  onClick={() =>
                    navigate(`/courses/${course.stream}/${toSeoSlug(course.name)}`)
                  }
                  className="text-sm text-slate-700 py-1.5 cursor-pointer hover:text-[#1E4A7A]"
                >
                  {course.name}
                </p>
              ))
            ) : (
              <p className="text-sm text-slate-500">No courses found</p>
            )}
          </div>
        </div>

        <div>
          <p className="font-bold text-[#0F2D52] mb-3">
            {activeCollege ? "Exams" : "All Exams"}
          </p>

          <div className="max-h-[360px] overflow-y-auto pr-1">
            {collegeMenuExams.length > 0 ? (
              collegeMenuExams.map((exam) => (
                <p
                  key={exam.id}
                  onClick={() =>
                    navigate(`/exams/${toSeoSlug(exam.name)}${exam.year ? `-${exam.year}` : ""}`)
                  }
                  className="text-sm text-slate-700 py-1.5 cursor-pointer hover:text-[#1E4A7A]"
                >
                  {exam.name}
                </p>
              ))
            ) : (
              <p className="text-sm text-slate-500">No exams found</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};


  return (
  <header 
  className="
    fixed top-0 left-0 right-0 z-50
    bg-white/10 
    backdrop-blur-xl
    border-b border-white/20
    shadow-[0_8px_25px_rgba(0,0,0,0.08)]
    rounded-bl-[18px] rounded-br-[18px]
  "
>


      {/* WRAPPER (fixed for mobile) */}
      <div className="max-w-9xl mx-auto px-3 py-2  ">

        {/* TOP BAR */}
        <div
          className="
    bg-white
    w-full 
    flex items-center justify-between
    
    px-3 py-1         /* Smaller padding on mobile */
    rounded-xl        /* Smaller curve on mobile */

    md:px-6 md:py-2   /* Normal size on desktop */
    md:rounded-10px   /* Fully rounded on desktop */
      bg-white/10 
    backdrop-blur-xl
  "
        >



          {/* LOGO */}
          <div
            onClick={() => navigate("/")}
            className="flex items-center gap-2 cursor-pointer"
          >
            <img src="/logos/StudyCups.png" className="h-8 w-auto md:h-10" />
          </div>

          {/* DESKTOP MENU */}
          <nav className="hidden lg:flex items-center space-x-6 text-base font-[380] text-[#0F2D52]">

            <button
              onClick={() => navigate("/")} className={tabClass("/") + " cursor-pointer"}
            >
              Home
            </button>

            <div
              className="relative"
              onMouseEnter={() => {
                setShowCollegesMenu(true);
                setShowCoursesMenu(false);
              }}
              onMouseLeave={() => {
                setShowCollegesMenu(false);
                setActiveCollege(null);
              }}
            >
              <button
                onClick={() => navigate("/colleges")}
                className={tabClass("/colleges")+" cursor-pointer"}
              >
                Colleges
              </button>

              {showCollegesMenu && <CollegesMegaMenu />}
            </div>

<div
  className="relative"
  onMouseEnter={() => {
    setShowCoursesMenu(true);
    setShowCollegesMenu(false);
  }}
  onMouseLeave={() => {
    setShowCoursesMenu(false);
    setActiveCourse(null);
  }}
>
  <button
    onClick={() => navigate("/courses")}
    className={tabClass("/courses") + " cursor-pointer"}
  >
    Courses
  </button>

  {showCoursesMenu && <CoursesMegaMenu />}
</div>





            <button
             onClick={() => navigate("/exams")} className={tabClass("/exams") + " cursor-pointer"}
            >
              Exams
            </button>

             <button
             onClick={() => navigate("/blog")} className={tabClass("/blog") + " cursor-pointer"}
            >
              Blog
            </button>

          
            <button
             onClick={() => navigate("/compare")} className={tabClass("/compare") + " cursor-pointer"}
            >
              Compare
            </button>


            <svg className="w-5 h-5 cursor-pointer hover:text-[#062042]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>

           <svg
 
  className="w-5 h-5 cursor-pointer hover:text-[#062042]"
  fill="none"
  stroke="currentColor"
  viewBox="0 0 24 24"
>
  <path
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth="2"
    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14c-4.418 0-7.879 
    2.067-9 5.385A2.327 2.327 0 005 21h14c1.092 0 
    2.016-.628 2.5-1.615C19.879 16.067 16.418 14 12 14z"
  />
</svg>


            <button
              onClick={onOpenApplyNow}
              className="bg-[#1E4A7A] text-white px-4 py-2 rounded-full font-semibold hover:bg-[#f4a71d]"
            >
              Apply Now
            </button>
          </nav>

          {/* MOBILE MENU BUTTON */}
          <button
            className="lg:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <svg className="w-7 h-7 text-[#0F2D52]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                d="M4 6h16M4 12h16m-7 6h7" />
            </svg>
          </button>
        </div>

        {/* MOBILE MENU */}
        {isMenuOpen && (
          <div className="lg:hidden bg-[#0F2D52] text-white mt-3 rounded-2xl px-5 py-5 space-y-3 shadow-xl">

            {[
              ["Home", "home"],
              ["Colleges", "colleges"],
              ["Courses", "courses"],
              ["Exams", "exams"],
              ["Blog", "blog"],
              ["Compare", "compare"],
            ].map(([label, page]) => (
              <button
                key={page}
              onClick={() => {
  navigate(
    page === "home" ? "/" : `/${page}`
  );
  setIsMenuOpen(false);
}}

                className="block w-full text-left py-2 text-base font-semibold"
              >
                {label}
              </button>
            ))}

            <button
              onClick={onOpenApplyNow}
              className="w-full mt-3 py-3 bg-[#1E4A7A] rounded-full font-semibold"
            >
              Apply Now
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
