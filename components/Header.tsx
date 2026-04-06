import React, { useState , useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import type { College } from "../types";
import { toCourseSlug } from "../pages/Seo";

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
const shouldPrepareMenuData =
  showCoursesMenu ||
  showCollegesMenu ||
  Boolean(activeCourse) ||
  Boolean(activeCollege);

const collegeLookupById = useMemo(() => {
  if (!shouldPrepareMenuData) return new Map<number, any>();

  const resultMap = new Map<number, any>();

  colleges.forEach((college: any) => {
    if (!college?.id || resultMap.has(college.id)) return;
    resultMap.set(college.id, college);
  });

  return resultMap;
}, [colleges, shouldPrepareMenuData]);

const allMenuColleges = useMemo(() => {
  if (!shouldPrepareMenuData) return [];

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
}, [colleges, shouldPrepareMenuData]);

const allMenuExams = useMemo(() => {
  if (!shouldPrepareMenuData || !Array.isArray(exams)) return [];

  const resultMap = new Map<string | number, any>();

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
}, [exams, shouldPrepareMenuData]);

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
                className={`text-sm py-1.5 cursor-default ${
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


  return (
  <header 
  className="
    fixed top-0 left-0 right-0 z-50
    bg-white/95
    border-b border-slate-200/80
    shadow-[0_8px_25px_rgba(0,0,0,0.08)]
    rounded-bl-[18px] rounded-br-[18px]
    md:bg-white/10
    md:backdrop-blur-xl
    md:border-white/20
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
    bg-white
    md:bg-white/10 
    md:backdrop-blur-xl
  "
        >



          {/* LOGO */}
          <div
            onClick={() => navigate("/")}
            className="flex items-center gap-2 cursor-pointer"
          >
            <img
              src="/logos/StudyCups.png"
              alt="StudyCups"
              width="160"
              height="40"
              fetchPriority="high"
              decoding="async"
              className="h-8 w-auto md:h-10"
            />
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
              className="bg-[#f4a71d] text-white px-4 py-2 rounded-full font-semibold hover:bg-[#1E4A7A]"
            >
              Free Counselling
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
              Free Counselling
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
