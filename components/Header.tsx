import React, { useState , useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import type { College } from "../types";
import { buildCourseDetailPath, toCourseSlug } from "../pages/Seo";



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

const normalizeCollegeSlugSource = (text: string = "") => {
  if (!text) return "";

  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) return "";

  const withoutDescription =
    normalized.split(/\s+(?:is|was|has|have|offers?|offering|ranked|established|founded|approved|affiliated|located|admission|note)\b/i)[0]?.trim() ||
    normalized;

  const firstChunk = withoutDescription.split(/[|,:;]+/)[0]?.trim() || withoutDescription;
  return firstChunk.replace(/[-\s|,:;]+$/g, "").trim();
};

const extractCollegeNameFromAbout = (aboutText: string = "") => {
  const cleaned = normalizeCollegeSlugSource(aboutText);
  if (cleaned.length < 6) return "";
  return cleaned;
};

const buildCollegeCodePrefix = (shortName: string = "") => {
  const words = shortName
    .replace(/\([^)]*\)/g, "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length < 2) return "";

  const first = words[0].replace(/[^A-Za-z]/g, "");
  const second = words[1].replace(/[^A-Za-z]/g, "");

  if (!first || first !== first.toUpperCase() || first.length < 2) return "";
  if (!second) return first.toLowerCase();

  return `${first.toLowerCase()}${second[0].toLowerCase()}`;
};

const Header: React.FC<HeaderProps> = ({ onOpenApplyNow  , colleges ,exams}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const [showCoursesMenu, setShowCoursesMenu] = useState(false);
  const [showCollegesMenu, setShowCollegesMenu] = useState(false);
  const [showToolsMenu, setShowToolsMenu] = useState(false);
  const [showExploreMenu, setShowExploreMenu] = useState(false);
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
  const matchedCourseName = Object.keys(COURSE_REGEX_MAP).find((label) =>
    COURSE_REGEX_MAP[label].test(courseName.toLowerCase())
  );
  const allowedExams = COURSE_EXAM_MAP[matchedCourseName || courseName];
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

const API_BASE = "https://studycupsbackend-wb8p.onrender.com/api";

const [activeCourse, setActiveCourse] = useState<{
  name: string;
  stream: string;
  slug?: string;
  colleges?: any[];
} | null>(null);  
const [activeCollege, setActiveCollege] = useState<any | null>(null);
const activeCollegeRef = React.useRef<any | null>(null);
const collegeMenuRequestRef = React.useRef(0);
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

const getMenuTextValue = (value: unknown) => {
  if (typeof value === "string") return value.trim();
  if (value && typeof value === "object" && "value" in value) {
    return String((value as { value?: unknown }).value ?? "").trim();
  }
  return "";
};

const getCollegeSummary = (college: any) => ({
  id: college?.id,
  name: college?.name,
  logoUrl: college?.logoUrl,
});

const buildCollegePath = (college: any) => {
  const collegeId = Number(college?.id);
  if (!collegeId) return "/university";

  const shortName = normalizeCollegeSlugSource(
    college?.basic?.name || college?.name || ""
  );
  const prefixCode = buildCollegeCodePrefix(shortName);
  const aboutBasedName = extractCollegeNameFromAbout(
    college?.basic?.about?.value ||
      college?.about?.value ||
      college?.rawScraped?.about_text ||
      college?.description ||
      ""
  );
  const longNameSource =
    [
      college?.basic?.full_name,
      college?.full_name,
      aboutBasedName,
      college?.rawScraped?.college_name,
      shortName,
    ]
      .map((value) => normalizeCollegeSlugSource(typeof value === "string" ? value : ""))
      .find(Boolean) || shortName;
  const longNameSlug = toSeoSlug(longNameSource);

  if (longNameSlug) {
    const fullSlug =
      prefixCode && !longNameSlug.startsWith(`${prefixCode}-`)
        ? `${prefixCode}-${longNameSlug}`
        : longNameSlug;
    return `/university/${collegeId}-${fullSlug}`;
  }

  const rawSlug = typeof college?.slug === "string" ? college.slug.trim() : "";
  if (rawSlug) {
    const cleaned = rawSlug.replace(/^\/+|\/+$/g, "").toLowerCase();
    const parts = cleaned.match(/^(.*)--(\d+)$/);
    const slugPart =
      parts && Number(parts[2]) === collegeId
        ? parts[1]
        : cleaned.replace(/^\d+-/, "");
    const normalizedSlugPart = toSeoSlug(slugPart);

    if (normalizedSlugPart) {
      return `/university/${collegeId}-${normalizedSlugPart}`;
    }
  }

  const fallbackName = toSeoSlug(college?.name || "");
  return fallbackName ? `/university/${collegeId}-${fallbackName}` : `/university/${collegeId}`;
};

const getCanonicalCourseName = (courseName = "") =>
  Object.keys(COURSE_REGEX_MAP).find((label) =>
    COURSE_REGEX_MAP[label].test(courseName.toLowerCase())
  ) || "";

const getCollegeCourseEntries = (college: any) => {
  const rawCourses = Array.isArray(college?.rawScraped?.courses)
    ? college.rawScraped.courses
    : [];
  const listedCourses = Array.isArray(college?.courses) ? college.courses : [];
  const fullTimeCourses = Array.isArray(college?.rawScraped?.courses_full_time)
    ? college.rawScraped.courses_full_time
    : [];

  return [...rawCourses, ...listedCourses, ...fullTimeCourses];
};

const getCourseCategoryFromName = (courseName = "") => {
  const matchedCourseName = getCanonicalCourseName(courseName);
  if (!matchedCourseName) return "general";

  const matchedCourse = getMenuCourses().find((course) => course.name === matchedCourseName);

  return matchedCourse?.stream || "general";
};

const getCourseMenuKey = (
  courseName = "",
  options: { preserveRawName?: boolean } = {}
) => {
  if (options.preserveRawName) {
    return `course:${toCourseSlug(courseName) || toSeoSlug(courseName)}`;
  }

  const canonicalCourseName = getCanonicalCourseName(courseName);
  if (canonicalCourseName) {
    return `canonical:${toSeoSlug(canonicalCourseName)}`;
  }

  return `course:${toCourseSlug(courseName) || toSeoSlug(courseName)}`;
};

const mergeMenuCourseEntry = (
  resultMap: Map<string, any>,
  course: any,
  college?: any,
  options: { preserveRawName?: boolean } = {}
) => {
  const rawCourseName =
    getMenuTextValue(course?.course_name) ||
    getMenuTextValue(course?.name) ||
    getMenuTextValue(course?.title);
  const canonicalCourseName = options.preserveRawName
    ? ""
    : getCanonicalCourseName(rawCourseName);
  const courseName = options.preserveRawName
    ? rawCourseName
    : canonicalCourseName || rawCourseName;

  if (!courseName) return;

  const courseKey = getCourseMenuKey(courseName, options);
  const explicitStream =
    getMenuTextValue(course?.stream) ||
    getMenuTextValue(course?.course_stream) ||
    getMenuTextValue(course?.stream_name);
  const detailSlug =
    getMenuTextValue(course?.slug_url) ||
    getMenuTextValue(course?.slug);
  const courseSlug = toCourseSlug(courseName);
  const existingEntry = resultMap.get(courseKey);

  if (existingEntry) {
    if (canonicalCourseName) {
      existingEntry.name = courseName;
    } else if (courseName.length < existingEntry.name.length) {
      existingEntry.name = courseName;
    }

    if (!existingEntry.slug && courseSlug) {
      existingEntry.slug = courseSlug;
    }

    if (!existingEntry.detailSlug && detailSlug) {
      existingEntry.detailSlug = detailSlug;
    }

    if (college?.id) {
      const alreadyIncluded = existingEntry.colleges.some(
        (item: any) => item.id === college.id
      );

      if (!alreadyIncluded) {
        existingEntry.colleges.push(getCollegeSummary(college));
      }
    }

    return;
  }

  resultMap.set(courseKey, {
    key: courseKey,
    name: courseName,
    slug: courseSlug,
    detailSlug,
    stream: explicitStream
      ? toSeoSlug(explicitStream)
      : getCourseCategoryFromName(courseName),
    colleges: college?.id ? [getCollegeSummary(college)] : [],
  });
};

const mergeMenuCourseTree = (
  resultMap: Map<string, any>,
  course: any,
  college?: any,
  options: { preserveRawName?: boolean } = {}
) => {
  mergeMenuCourseEntry(resultMap, course, college, options);

  const parentCourseName =
    getMenuTextValue(course?.course_name) ||
    getMenuTextValue(course?.name) ||
    getMenuTextValue(course?.title);
  const parentStream =
    getMenuTextValue(course?.stream) ||
    getMenuTextValue(course?.course_stream) ||
    getMenuTextValue(course?.stream_name);
  const subCourses = Array.isArray(course?.sub_courses) ? course.sub_courses : [];

  subCourses.forEach((subCourse: any) => {
    mergeMenuCourseEntry(
      resultMap,
      {
        ...subCourse,
        course_name:
          getMenuTextValue(subCourse?.course_name) ||
          getMenuTextValue(subCourse?.name) ||
          getMenuTextValue(subCourse?.title) ||
          parentCourseName,
        stream:
          getMenuTextValue(subCourse?.stream) ||
          getMenuTextValue(subCourse?.course_stream) ||
          getMenuTextValue(subCourse?.stream_name) ||
          parentStream,
      },
      college,
      options
    );
  });
};

const getExamsForMenuCourses = (courseEntries: any[] = []) => {
  const resultMap = new Map<string | number, any>();

  courseEntries.forEach((course) => {
    getExamsForCourse(course.name).forEach((exam) => {
      const examKey = exam?.id ?? `${exam?.name}-${exam?.year ?? ""}`;
      if (resultMap.has(examKey)) return;

      resultMap.set(examKey, exam);
    });
  });

  return Array.from(resultMap.values());
};

const fetchCollegeMenuCourses = async (
  college: any,
  options: { preserveRawName?: boolean } = {}
) => {
  const cacheKey = options.preserveRawName
    ? `college-courses:detailed:${college?.id}`
    : `college-courses:${college?.id}`;
  const cachedCourses = hoverCache.current[cacheKey];
  if (Array.isArray(cachedCourses)) {
    return cachedCourses;
  }

  const response = await fetch(
    `${API_BASE}/college-course/college/${college.id}`
  );
  const json = await response.json();
  const docs = Array.isArray(json?.data) ? json.data : [];
  const resultMap = new Map<string, any>();

  docs.forEach((doc: any) => {
    const courses = Array.isArray(doc?.courses) ? doc.courses : [];
    courses.forEach((course: any) =>
      mergeMenuCourseTree(resultMap, course, college, options)
    );
  });

  const uniqueCourses = Array.from(resultMap.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  hoverCache.current[cacheKey] = uniqueCourses;
  return uniqueCourses;
};

const getCollegeCourseFallbackPath = (college: any, course: any) => {
  const detailSlug =
    getMenuTextValue(course?.detailSlug) ||
    getMenuTextValue(course?.slug_url) ||
    getMenuTextValue(course?.slug) ||
    toCourseSlug(course?.name || "");

  if (!college?.id || !detailSlug) return "";

  return `${buildCollegePath(college)}/course/${detailSlug}`;
};

const handleCollegeMenuCourseClick = (course: any) => {
  const selectedCollegeSummary =
    activeCollegeRef.current || activeCollege || course?.colleges?.[0];
  const selectedCollege =
    collegeLookupById.get(selectedCollegeSummary?.id) || selectedCollegeSummary;

  if (!selectedCollege) {
    return;
  }

  const collegeFallbackPath = getCollegeCourseFallbackPath(selectedCollege, course);
  if (!collegeFallbackPath) {
    return;
  }

  navigate(collegeFallbackPath);
};

const getMatchableCourseValues = (college: any) => {
  const courseEntries = getCollegeCourseEntries(college);

  return [
    college?.stream,
    ...courseEntries.map(
      (course: any) =>
        getMenuTextValue(course?.name) ||
        getMenuTextValue(course?.course_name) ||
        getMenuTextValue(course?.title)
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

  let isCancelled = false;

  setActiveCollege(null);
  activeCollegeRef.current = null;
  setCollegeMenuColleges(allMenuColleges);
  setCollegeMenuExams(allMenuExams);

  const cachedAllCourses = hoverCache.current["all-college-courses"];
  if (Array.isArray(cachedAllCourses)) {
    setLoadingMenu(false);
    setCollegeMenuCourses(cachedAllCourses);
    return;
  }

  setCollegeMenuCourses([]);
  setLoadingMenu(true);

  const loadAllCollegeCourses = async () => {
    const resultMap = new Map<string, any>();
    const batchSize = 12;

    try {
      for (let index = 0; index < colleges.length; index += batchSize) {
        const batch = colleges.slice(index, index + batchSize);
        const batchResults = await Promise.allSettled(
          batch.map((college) => fetchCollegeMenuCourses(college))
        );

        batchResults.forEach((result) => {
          if (result.status !== "fulfilled") return;

          result.value.forEach((course: any) => {
            const existingEntry = resultMap.get(course.key);

            if (!existingEntry) {
              resultMap.set(course.key, {
                ...course,
                colleges: Array.isArray(course.colleges) ? [...course.colleges] : [],
              });
              return;
            }

            if (course.name.length < existingEntry.name.length) {
              existingEntry.name = course.name;
            }

            if (!existingEntry.slug && course.slug) {
              existingEntry.slug = course.slug;
            }

            (course.colleges || []).forEach((collegeItem: any) => {
              const alreadyIncluded = existingEntry.colleges.some(
                (item: any) => item.id === collegeItem.id
              );

              if (!alreadyIncluded) {
                existingEntry.colleges.push(collegeItem);
              }
            });
          });
        });
      }

      const uniqueCourses = Array.from(resultMap.values()).sort((a, b) =>
        a.name.localeCompare(b.name)
      );

      hoverCache.current["all-college-courses"] = uniqueCourses;

      if (!isCancelled && !activeCollegeRef.current) {
        setCollegeMenuCourses(uniqueCourses);
      }
    } finally {
      if (!isCancelled && !activeCollegeRef.current) {
        setLoadingMenu(false);
      }
    }
  };

  loadAllCollegeCourses();

  return () => {
    isCancelled = true;
  };
}, [showCollegesMenu, allMenuColleges, allMenuExams, colleges]);

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

const getCourseCategoriesForCollege = (college: any) => {
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

const getCoursesForCollege = (college: any) => {
  const resultMap = new Map<string, { name: string; stream: string }>();

  getCollegeCourseEntries(college).forEach((course: any) => {
    const courseName =
      getMenuTextValue(course?.course_name) ||
      getMenuTextValue(course?.name) ||
      getMenuTextValue(course?.title);

    if (!courseName) return;

    const courseKey = courseName.toLowerCase().replace(/\s+/g, " ").trim();
    if (resultMap.has(courseKey)) return;

    const explicitStream =
      getMenuTextValue(course?.stream) ||
      getMenuTextValue(course?.course_stream) ||
      getMenuTextValue(course?.stream_name);

    resultMap.set(courseKey, {
      name: courseName,
      stream: explicitStream
        ? toSeoSlug(explicitStream)
        : getCourseCategoryFromName(courseName),
    });
  });

  if (resultMap.size > 0) {
    return Array.from(resultMap.values());
  }

  return getCourseCategoriesForCollege(college);
};

const getExamsForCollege = (college: any) => {
  const resultMap = new Map<string | number, any>();

  getCourseCategoriesForCollege(college).forEach((course) => {
    getExamsForCourse(course.name).forEach((exam) => {
      const examKey = exam?.id ?? `${exam?.name}-${exam?.year ?? ""}`;
      if (resultMap.has(examKey)) return;

      resultMap.set(examKey, exam);
    });
  });

  return Array.from(resultMap.values());
};





const handleCourseHover = (course: {
  name: string;
  stream: string;
  slug?: string;
  colleges?: any[];
}) => {
  setActiveCourse(course);

  const collegesMatched =
    Array.isArray(course.colleges) && course.colleges.length > 0
      ? course.colleges
      : getCollegesForCourse(course.name); 
  const examsMatched = getExamsForCourse(course.name); // ✅ ADD 


  setMenuColleges(collegesMatched);
  setMenuExams(examsMatched); // ✅ ADD 
};

const handleCollegeHover = async (college: any) => {
  const sourceCollege = collegeLookupById.get(college?.id) || college;
  const requestId = ++collegeMenuRequestRef.current;

  setActiveCollege(sourceCollege);
  activeCollegeRef.current = sourceCollege;

  const cachedCourses = hoverCache.current[`college-courses:detailed:${sourceCollege?.id}`];
  if (Array.isArray(cachedCourses)) {
    setLoadingMenu(false);
    setCollegeMenuCourses(cachedCourses);
    setCollegeMenuExams(getExamsForMenuCourses(cachedCourses));
    return;
  }

  setLoadingMenu(true);
  setCollegeMenuCourses([]);

  try {
    const fetchedCourses = await fetchCollegeMenuCourses(sourceCollege, {
      preserveRawName: true,
    });
    if (collegeMenuRequestRef.current !== requestId) return;

    setCollegeMenuCourses(fetchedCourses);
    setCollegeMenuExams(getExamsForMenuCourses(fetchedCourses));
  } catch (error) {
    if (collegeMenuRequestRef.current !== requestId) return;

    console.error("College menu courses API error:", error);
    setCollegeMenuCourses(getCoursesForCollege(sourceCollege));
    setCollegeMenuExams(getExamsForCollege(sourceCollege));
  } finally {
    if (collegeMenuRequestRef.current === requestId) {
      setLoadingMenu(false);
    }
  }
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
    navigate(buildCourseDetailPath(course.stream, course.name))
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
            onClick={() => navigate("/college-predictor")}
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
                    navigate(buildCollegePath(collegeLookupById.get(college?.id) || college))
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
            {loadingMenu && collegeMenuCourses.length === 0 ? (
              <p className="text-sm text-slate-500">Loading courses...</p>
            ) : collegeMenuCourses.length > 0 ? (
              collegeMenuCourses.map((course) => (
                <p
                  key={course.key || course.name}
                  onClick={() => {
                    void handleCollegeMenuCourseClick(course);
                  }}
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


  const [activeStream, setActiveStream] = React.useState(null);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [mobileAccordion, setMobileAccordion] = React.useState(null);
  const navBarRef = React.useRef<HTMLDivElement>(null);

  // Close desktop dropdown when clicking outside
  React.useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (navBarRef.current && !navBarRef.current.contains(e.target as Node)) {
        setActiveStream(null);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const STREAMS = [
    {
      id: "engineering", label: "Engineering", icon: "⚙️", path: "/engineering/top-colleges",
      streamFilter: /(engineer|btech|b\.tech|mtech)/i,
      courses: ["B.E / B.Tech", "M.E / M.Tech", "BCA", "MCA"],
      examKeys: ["JEE Main", "JEE Advanced", "GATE", "MHT-CET"],
      cities: ["Delhi", "Bangalore", "Mumbai", "Chennai", "Pune", "Hyderabad", "Ahmedabad", "Kolkata", "Noida", "Coimbatore"],
      states: ["Maharashtra", "Karnataka", "Tamil Nadu", "Uttar Pradesh", "Rajasthan", "West Bengal", "Gujarat", "Telangana", "Andhra Pradesh", "Madhya Pradesh"],
    },
    {
      id: "management", label: "MBA", icon: "💼", path: "/management/top-colleges",
      streamFilter: /(mba|pgdm|management|bba)/i,
      courses: ["MBA / PGDM", "BBA"],
      examKeys: ["CAT", "XAT", "CMAT", "MAT"],
      cities: ["Delhi", "Bangalore", "Mumbai", "Pune", "Hyderabad", "Ahmedabad", "Kolkata", "Chennai", "Lucknow", "Jaipur"],
      states: ["Maharashtra", "Delhi", "Karnataka", "Tamil Nadu", "Gujarat", "West Bengal", "Uttar Pradesh", "Rajasthan", "Telangana", "Punjab"],
    },
    {
      id: "medical", label: "Medical", icon: "🏥", path: "/medical/top-colleges",
      streamFilter: /(medical|mbbs|pharma)/i,
      courses: ["MBBS"],
      examKeys: ["NEET"],
      cities: ["Delhi", "Bangalore", "Mumbai", "Chennai", "Hyderabad", "Kolkata", "Pune", "Ahmedabad", "Lucknow", "Manipal"],
      states: ["Maharashtra", "Karnataka", "Tamil Nadu", "Uttar Pradesh", "Andhra Pradesh", "West Bengal", "Delhi", "Kerala", "Rajasthan", "Madhya Pradesh"],
    },
    {
      id: "arts", label: "Arts & Science", icon: "🎓", path: "/arts/top-colleges",
      streamFilter: /(arts|science|bsc)/i,
      courses: ["BA", "B.Sc", "B.Com"],
      examKeys: ["CUET"],
      cities: ["Delhi", "Bangalore", "Mumbai", "Chennai", "Kolkata", "Hyderabad", "Pune", "Jaipur", "Ahmedabad", "Chandigarh"],
      states: ["Maharashtra", "Tamil Nadu", "Karnataka", "West Bengal", "Delhi", "Gujarat", "Rajasthan", "Uttar Pradesh", "Punjab", "Kerala"],
    },
    {
      id: "law", label: "Law", icon: "⚖️", path: "/law/top-colleges",
      streamFilter: /(law|llb)/i,
      courses: ["LLB"],
      examKeys: ["CLAT", "AILET"],
      cities: ["Delhi", "Mumbai", "Bangalore", "Chennai", "Kolkata", "Hyderabad", "Pune", "Lucknow", "Jaipur", "Ahmedabad"],
      states: ["Maharashtra", "Delhi", "Tamil Nadu", "Karnataka", "West Bengal", "Uttar Pradesh", "Rajasthan", "Andhra Pradesh", "Gujarat", "Punjab"],
    },
    {
      id: "design", label: "Design", icon: "🌸", path: "/design/top-colleges",
      streamFilter: /(design|fashion|architecture)/i,
      courses: ["B.Des", "M.Des"],
      examKeys: ["NID", "NIFT"],
      cities: ["Delhi", "Mumbai", "Bangalore", "Chennai", "Ahmedabad", "Pune", "Kolkata", "Hyderabad", "Jaipur", "Indore"],
      states: ["Maharashtra", "Delhi", "Karnataka", "Tamil Nadu", "Gujarat", "West Bengal", "Rajasthan", "Uttar Pradesh", "Telangana", "Madhya Pradesh"],
    },
  ];

  const getStreamColleges = (stream) =>
    colleges.filter((c) => stream.streamFilter.test(c.stream || "") || stream.streamFilter.test(c.name || "")).slice(0, 6);

  const getStreamExams = (stream) =>
    (exams || []).filter((e) => stream.examKeys.some(key => e.name?.toLowerCase().includes(key.toLowerCase()))).slice(0, 5);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) navigate(`/colleges?q=${encodeURIComponent(searchQuery)}`);
  };

  return (
  <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md shadow-[0_2px_16px_rgba(0,0,0,0.08)]">

    {/* ── TOP BAR ── */}
    <div className="bg-transparent">
      <div className="max-w-[1400px] mx-auto px-4 h-14 flex items-center gap-3">

        {/* Logo – left, aligned with streams (pl-8 offset) */}
        <div onClick={() => navigate("/")} className="flex items-center cursor-pointer flex-shrink-0 pl-8">
          <img src="/logos/StudyCups.png" className="h-9 w-auto" alt="StudyCups" />
        </div>

        {/* Search bar – flex-1 */}
        <div className="flex-1 flex">
          <form onSubmit={handleSearch} className="w-full max-w-lg hidden md:flex">
            <div className="w-full flex items-center bg-white/90 border border-slate-200 rounded-full px-4 gap-2 h-9 shadow-sm focus-within:ring-2 focus-within:ring-[#1E4A7A]/30 transition">
              <svg className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
              <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search colleges, courses, exams..."
                className="flex-1 bg-transparent text-slate-700 text-[13px] placeholder-slate-400 outline-none" />
            </div>
          </form>
        </div>

        {/* Free Counselling – blinking blue */}
        <button onClick={onOpenApplyNow}
          className="hidden md:flex items-center gap-2 bg-[#1877F2] text-white font-bold text-[13px] px-5 py-2 rounded-full shadow whitespace-nowrap relative overflow-hidden"
          style={{ animation: "freeCounselBlink 1.6s ease-in-out infinite" }}>
          <span className="w-2 h-2 rounded-full bg-white animate-ping absolute left-3 opacity-75" />
          <span className="pl-3">Free Counselling</span>
        </button>

        {/* Student Login */}
        <button
          onClick={() => navigate("/coming-soon")}
          className="hidden md:flex items-center gap-1.5 border border-slate-300 text-slate-700 font-semibold text-[13px] px-4 py-2 rounded-full hover:bg-slate-100 transition whitespace-nowrap">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
          </svg>
          Student Login
        </button>

        {/* Hamburger */}
        <button className="lg:hidden text-[#0F2D52] ml-1" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          {isMenuOpen
            ? <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
            : <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
          }
        </button>
      </div>
    </div>

    {/* Inline keyframe for Free Counselling blink + dropdown/accordion slide */}
    <style>{`
      @keyframes freeCounselBlink {
        0%, 100% { background-color: #1877F2; box-shadow: 0 0 0 0 rgba(24,119,242,0.5); }
        50% { background-color: #0d5fd4; box-shadow: 0 0 0 6px rgba(24,119,242,0); }
      }
      @keyframes navDropSlide {
        from { opacity: 0; transform: translateY(-10px) scaleY(0.96); }
        to   { opacity: 1; transform: translateY(0)    scaleY(1); }
      }
      .nav-drop-enter {
        animation: navDropSlide 0.22s cubic-bezier(0.4,0,0.2,1) forwards;
        transform-origin: top center;
      }
      @keyframes accordionSlideOpen {
        from { opacity: 0; max-height: 0; }
        to   { opacity: 1; max-height: 700px; }
      }
      .accordion-open {
        animation: accordionSlideOpen 0.28s cubic-bezier(0.4,0,0.2,1) forwards;
        overflow: hidden;
      }
    `}</style>

    {/* ── NAV BAR (desktop) ── */}
    <div ref={navBarRef} className="hidden lg:block bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-[1400px] mx-auto px-4">
        <nav className="flex items-center h-11 gap-0.5 pl-8">

          {STREAMS.map(stream => (
            <div key={stream.id} className="relative h-full flex items-center"
              onMouseEnter={() => setActiveStream(stream.id)}
              onMouseLeave={() => setActiveStream(null)}
            >
              {/* Tap/click → toggle dropdown; hover still works on desktop */}
              <button onClick={() => setActiveStream(prev => prev === stream.id ? null : stream.id)}
                className={`flex items-center gap-1.5 px-3 h-full text-[13px] font-[600] transition-colors relative select-none ${
                  activeStream === stream.id || activePage.includes(stream.id)
                    ? "text-orange-500" : "text-slate-700 hover:text-orange-500"}`}
              >
                <span>{stream.icon}</span>
                {stream.label}
                <svg className={`w-3 h-3 opacity-50 transition-transform duration-200 ${activeStream === stream.id ? "rotate-180" : ""}`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7"/>
                </svg>
                {(activeStream === stream.id || activePage.includes(stream.id)) && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-orange-500 rounded-t" />
                )}
              </button>

              {/* MEGA DROPDOWN — slides down on tap/hover */}
              {activeStream === stream.id && (
                <div className="nav-drop-enter absolute left-0 top-full z-50 w-[960px] bg-white rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.16)] border border-slate-100 p-5">
                  <div className="grid grid-cols-4 gap-5">

                    {/* TOP COLLEGES */}
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">🏛️ Top Colleges</p>
                      {getStreamColleges(stream).map((c) => (
                        <button key={c.id} onClick={() => { navigate(buildCollegePath(c)); setActiveStream(null); }}
                          className="block w-full text-left py-1.5 text-[13px] text-slate-700 hover:text-orange-500 truncate transition">
                          {c.name}
                        </button>
                      ))}
                      {getStreamColleges(stream).length === 0 && (
                        <p className="text-[12px] text-slate-400 py-1">Loading...</p>
                      )}
                      <button onClick={() => { navigate(stream.path); setActiveStream(null); }}
                        className="mt-2 text-[12px] font-bold text-blue-600 hover:underline">
                        All {stream.label} Colleges →
                      </button>
                    </div>

                    {/* COURSES */}
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">📚 Courses</p>
                      {stream.courses.map(course => (
                        <button key={course} onClick={() => { navigate("/courses"); setActiveStream(null); }}
                          className="block w-full text-left py-1.5 text-[13px] text-slate-700 hover:text-orange-500 transition">
                          {course}
                        </button>
                      ))}
                      <button onClick={() => { navigate("/courses"); setActiveStream(null); }}
                        className="mt-2 text-[12px] font-bold text-blue-600 hover:underline">
                        All {stream.label} Courses →
                      </button>
                      <div className="mt-4 border-t border-slate-100 pt-3">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">📝 Entrance Exams</p>
                        {getStreamExams(stream).map((e) => (
                          <button key={e.id || e.name}
                            onClick={() => { navigate(`/exams/${toSeoSlug(e.name)}${e.year ? `-${e.year}` : ""}`); setActiveStream(null); }}
                            className="block w-full text-left py-1 text-[12px] text-slate-700 hover:text-orange-500 transition">
                            {e.name}
                          </button>
                        ))}
                        {getStreamExams(stream).length === 0 && stream.examKeys.slice(0, 4).map(k => (
                          <p key={k} className="py-1 text-[12px] text-slate-400">{k}</p>
                        ))}
                      </div>
                    </div>

                    {/* COLLEGE BY CITY */}
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">📍 Top Cities</p>
                      {stream.cities.map(city => (
                        <button key={city}
                          onClick={() => { navigate(`/${stream.id}/top-colleges-in-${toSeoSlug(city)}`); setActiveStream(null); }}
                          className="block w-full text-left py-1.5 text-[13px] text-slate-700 hover:text-orange-500 transition">
                          {stream.label} Colleges in {city}
                        </button>
                      ))}
                    </div>

                    {/* COLLEGE BY STATE + CTA */}
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">🗺️ Top States</p>
                      {stream.states.map(state => (
                        <button key={state}
                          onClick={() => { navigate(`/${stream.id}/top-colleges-in-${toSeoSlug(state)}`); setActiveStream(null); }}
                          className="block w-full text-left py-1.5 text-[13px] text-slate-700 hover:text-orange-500 transition">
                          {stream.label} Colleges in {state}
                        </button>
                      ))}
                      <div className="mt-3 bg-orange-50 rounded-xl p-3 border border-orange-100">
                        <p className="text-[11px] font-bold text-orange-700 mb-0.5">🎯 Predict your college</p>
                        <p className="text-[10px] text-slate-500 mb-1.5">Based on your rank &amp; score</p>
                        <button onClick={() => { navigate("/college-predictor"); setActiveStream(null); }}
                          className="text-[11px] font-bold text-orange-600 hover:underline">
                          Predict your college →
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}

          <span className="mx-2 h-5 w-px bg-slate-200" />

          {/* Tools dropdown */}
          <div className="relative h-full flex items-center"
            onMouseEnter={() => { setShowToolsMenu(true); setActiveStream(null); }}
            onMouseLeave={() => setShowToolsMenu(false)}>
            <button onClick={() => setShowToolsMenu(p => !p)}
              className={`flex items-center gap-1 px-3 h-full text-[13px] font-[600] transition-colors select-none ${showToolsMenu ? "text-orange-500" : "text-slate-700 hover:text-orange-500"}`}>
              <span>📈</span> Tools
              <svg className={`w-3 h-3 opacity-50 transition-transform duration-200 ${showToolsMenu ? "rotate-180" : ""}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7"/>
              </svg>
            </button>
            {showToolsMenu && (
              <div className="nav-drop-enter absolute left-0 top-full z-50 w-52 bg-white rounded-2xl shadow-xl border border-slate-100 py-2">
                {[
                  { icon: "🎯", label: "College Predictor", path: "/college-predictor" },
                  { icon: "📊", label: "ROI Calculator", path: "/roi-calculator" },
                  { icon: "🏆", label: "NIRF Insights", path: "/nirf-insights" },
                  { icon: "🤖", label: "AI College Finder", path: "/ai-college-finder" },
                  { icon: "⚖️", label: "Compare Colleges", path: "/compare" },
                  { icon: "💬", label: "Free Counselling", path: "/free-counselling" },
                ].map(item => (
                  <button key={item.path} onClick={() => { navigate(item.path); setShowToolsMenu(false); }}
                    className="flex items-center gap-3 w-full px-4 py-2 text-[13px] text-slate-700 hover:bg-orange-50 hover:text-orange-600 transition text-left">
                    <span>{item.icon}</span>{item.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Explore dropdown */}
          <div className="relative h-full flex items-center"
            onMouseEnter={() => { setShowExploreMenu(true); setActiveStream(null); }}
            onMouseLeave={() => setShowExploreMenu(false)}>
            <button onClick={() => setShowExploreMenu(p => !p)}
              className={`flex items-center gap-1 px-3 h-full text-[13px] font-[600] transition-colors select-none ${showExploreMenu ? "text-orange-500" : "text-slate-700 hover:text-orange-500"}`}>
              <span>🔍</span> Explore
              <svg className={`w-3 h-3 opacity-50 transition-transform duration-200 ${showExploreMenu ? "rotate-180" : ""}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7"/>
              </svg>
            </button>
            {showExploreMenu && (
              <div className="nav-drop-enter absolute right-0 top-full z-50 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 py-2">
                {[
                  { icon: "🏛️", label: "All Colleges", path: "/colleges" },
                  { icon: "📚", label: "All Courses", path: "/courses" },
                  { icon: "📝", label: "Entrance Exams", path: "/exams" },
                  { icon: "📰", label: "Blog & Guides", path: "/blog" },
                  { icon: "📅", label: "Events", path: "/events" },
                ].map(item => (
                  <button key={item.path} onClick={() => { navigate(item.path); setShowExploreMenu(false); }}
                    className="flex items-center gap-3 w-full px-4 py-2 text-[13px] text-slate-700 hover:bg-orange-50 hover:text-orange-600 transition text-left">
                    <span>{item.icon}</span>{item.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <span className="mx-2 h-5 w-px bg-slate-200" />

          {/* Write a Review */}
          <button
            onClick={() => navigate("/coming-soon")}
            className="flex items-center gap-1.5 px-3 h-full text-[13px] font-[600] text-slate-700 hover:text-orange-500 transition whitespace-nowrap">
            ✍️ Write a Review
          </button>

        </nav>
      </div>
    </div>

    {/* ── MOBILE DRAWER ── */}
    {isMenuOpen && (
      <div className="lg:hidden fixed inset-0 z-[100] flex h-screen">
        <div className="absolute inset-0 bg-black/50" onClick={() => setIsMenuOpen(false)} />
        <div className="relative ml-auto w-[300px] h-screen bg-white flex flex-col shadow-2xl overflow-y-auto">

          {/* Drawer header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <div onClick={() => { navigate("/"); setIsMenuOpen(false); }} className="cursor-pointer">
              <img src="/logos/StudyCups.png" className="h-8 w-auto" alt="StudyCups" />
            </div>
            <button onClick={() => setIsMenuOpen(false)} className="text-slate-500 hover:text-slate-800">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          {/* Search */}
          <div className="px-4 py-3 border-b border-slate-100">
            <div className="flex items-center bg-slate-100 rounded-full px-3 gap-2 h-9">
              <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
              <input placeholder="Search colleges..." className="flex-1 bg-transparent text-[13px] outline-none text-slate-700 placeholder-slate-400" />
            </div>
          </div>

          {/* Accordion */}
          <div className="flex-1 overflow-y-auto">
            {STREAMS.map(stream => (
              <div key={stream.id} className="border-b border-slate-100">
                <button
                  onClick={() => setMobileAccordion(mobileAccordion === stream.id ? null : stream.id)}
                  className="flex items-center justify-between w-full px-4 py-3.5 text-[14px] font-[600] text-slate-800"
                >
                  <span className="flex items-center gap-2.5"><span>{stream.icon}</span>{stream.label}</span>
                  <svg className={`w-4 h-4 text-slate-400 transition-transform ${mobileAccordion === stream.id ? "rotate-180" : ""}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7"/>
                  </svg>
                </button>
                {mobileAccordion === stream.id && (
                  <div className="accordion-open bg-slate-50 px-4 pb-3">
                    {getStreamColleges(stream).length > 0 && (
                      <>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 py-2">Top Colleges</p>
                        {getStreamColleges(stream).map((c) => (
                          <button key={c.id} onClick={() => { navigate(buildCollegePath(c)); setIsMenuOpen(false); }}
                            className="block w-full text-left py-1.5 text-[13px] text-slate-600 hover:text-orange-500">
                            {c.name}
                          </button>
                        ))}
                      </>
                    )}
                    <button onClick={() => { navigate(stream.path); setIsMenuOpen(false); }}
                      className="mt-2 text-[12px] font-bold text-blue-600">
                      All {stream.label} Colleges →
                    </button>
                    {/* CITIES */}
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 pt-3 pb-1">📍 By City</p>
                    <div className="grid grid-cols-2 gap-x-2">
                      {stream.cities.slice(0, 6).map(city => (
                        <button key={city}
                          onClick={() => { navigate(`/${stream.id}/top-colleges-in-${toSeoSlug(city)}`); setIsMenuOpen(false); }}
                          className="text-left py-1 text-[12px] text-slate-600 hover:text-orange-500 truncate">
                          {city}
                        </button>
                      ))}
                    </div>
                    {/* STATES */}
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 pt-2 pb-1">🗺️ By State</p>
                    <div className="grid grid-cols-2 gap-x-2">
                      {stream.states.slice(0, 6).map(state => (
                        <button key={state}
                          onClick={() => { navigate(`/${stream.id}/top-colleges-in-${toSeoSlug(state)}`); setIsMenuOpen(false); }}
                          className="text-left py-1 text-[12px] text-slate-600 hover:text-orange-500 truncate">
                          {state}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Tools accordion */}
            <div className="border-b border-slate-100">
              <button onClick={() => setMobileAccordion(mobileAccordion === "tools" ? null : "tools")}
                className="flex items-center justify-between w-full px-4 py-3.5 text-[14px] font-[600] text-slate-800">
                <span className="flex items-center gap-2.5"><span>📈</span>Tools</span>
                <svg className={`w-4 h-4 text-slate-400 transition-transform ${mobileAccordion === "tools" ? "rotate-180" : ""}`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7"/>
                </svg>
              </button>
              {mobileAccordion === "tools" && (
                <div className="accordion-open bg-slate-50 px-4 pb-3 grid grid-cols-2 gap-1">
                  {[
                    ["🎯","College Predictor","/college-predictor"],
                    ["📊","ROI Calculator","/roi-calculator"],
                    ["🏆","NIRF Insights","/nirf-insights"],
                    ["🤖","AI Finder","/ai-college-finder"],
                    ["⚖️","Compare","/compare"],
                    ["💬","Counselling","/free-counselling"],
                  ].map(([icon,label,path]) => (
                    <button key={path} onClick={() => { navigate(path); setIsMenuOpen(false); }}
                      className="flex items-center gap-1.5 py-2 text-[12px] text-slate-600 hover:text-orange-500">
                      <span>{icon}</span>{label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Explore links */}
            <div className="px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Explore</p>
              {[
                ["📰","Blog & Guides","/blog"],
                ["📝","Entrance Exams","/exams"],
                ["📚","All Courses","/courses"],
                ["🏛️","All Colleges","/colleges"],
              ].map(([icon,label,path]) => (
                <button key={path} onClick={() => { navigate(path); setIsMenuOpen(false); }}
                  className="flex items-center gap-2 w-full py-2.5 text-[13px] text-slate-600 hover:text-orange-500 border-b border-slate-100 last:border-0">
                  <span>{icon}</span>{label}
                </button>
              ))}
            </div>
          </div>

          {/* Bottom CTAs */}
          <div className="border-t border-slate-100 p-4 flex flex-col gap-2">
            <button onClick={() => { onOpenApplyNow(); setIsMenuOpen(false); }}
              className="w-full flex items-center justify-center gap-2 bg-[#1877F2] text-white font-bold text-[13px] py-2.5 rounded-full"
              style={{ animation: "freeCounselBlink 1.6s ease-in-out infinite" }}>
              📞 Free Counselling
            </button>
            <div className="flex gap-2">
              <button onClick={() => { navigate("/coming-soon"); setIsMenuOpen(false); }}
                className="flex-1 flex items-center justify-center gap-1.5 border border-slate-300 text-slate-700 font-semibold text-[12px] py-2.5 rounded-full hover:bg-slate-100">
                👤 Student Login
              </button>
              <button onClick={() => { navigate("/coming-soon"); setIsMenuOpen(false); }}
                className="flex-1 flex items-center justify-center gap-1.5 border border-slate-300 text-slate-700 font-semibold text-[12px] py-2.5 rounded-full hover:bg-slate-100">
                ✍️ Write a Review
              </button>
            </div>
          </div>
        </div>
      </div>
    )}
  </header>
  );
};

export default Header;
