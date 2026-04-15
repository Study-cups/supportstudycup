import React, { useState, useMemo, useEffect, useRef } from "react";
import type { View, College } from "../types";
import { useOnScreen } from "../hooks/useOnScreen";
import { useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom"; 
import { buildCourseDetailPath, toCourseSlug } from "./Seo"
import { ArrowRight, ChevronDown, GraduationCap } from "lucide-react";

/* ================= ANIMATION ================= */

const AnimatedContainer: React.FC<{
  children: React.ReactNode;
  delay?: number;
  className?: string;
}> = ({ children, delay = 0, className = "" }) => {
  const [ref, isVisible] = useOnScreen<HTMLDivElement>({ threshold: 0.1 });
  return (
    <div
      ref={ref}
      className={`opacity-0 ${isVisible ? "animate-fadeInUp" : ""} ${className}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

/* ================= HASH ================= */

const hashIndex = (str: string) => {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
};

interface CoursesPageProps {
 
  initialStream?: string;
}
const normalizeText = (text = "") =>
  text
    .toLowerCase()
    .replace(/[().]/g, "")      // remove dots & brackets
    .replace(/\s+/g, " ")
    .trim();

const tokenize = (text = "") =>
  normalizeText(text).split(" ");

type CourseSectionKey = "postgraduate" | "undergraduate" | "popular";
type NormalizedCourseLevel =
  | "Postgraduate"
  | "Undergraduate"
  | "Doctoral"
  | "Certificate";

const normalizeFacetKey = (value = "") =>
  value.toLowerCase().replace(/[^a-z]/g, "");

const STREAM_MATCHERS = {
  engineering: ["engineering", "btech", "technology", "be"],
  management: ["management", "mba", "pgdm", "business", "executive"],
  medical: ["medical", "mbbs", "health", "nursing", "pharma"],
  commerce: ["commerce", "bcom", "account", "finance", "economics"],
  arts: ["arts", "humanities", "social", "science", "ba", "bsc"],
  law: ["law", "llb", "legal"],
  design: ["design", "fashion"],
} as const;

const resolveRequestedStream = (requestedStream = "", availableStreams: string[] = []) => {
  const trimmedRequested = requestedStream.trim();
  if (!trimmedRequested) return "All";

  const selectableStreams = availableStreams.filter((stream) => stream !== "All");
  if (!selectableStreams.length) return trimmedRequested;
  if (selectableStreams.includes(trimmedRequested)) return trimmedRequested;

  const normalizedRequested = normalizeFacetKey(trimmedRequested);

  const exactLikeMatch = selectableStreams.find((stream) => {
    const normalizedStream = normalizeFacetKey(stream);
    return (
      normalizedStream === normalizedRequested ||
      normalizedStream.includes(normalizedRequested) ||
      normalizedRequested.includes(normalizedStream)
    );
  });

  if (exactLikeMatch) return exactLikeMatch;

  const matcherEntry = Object.values(STREAM_MATCHERS).find((keywords) =>
    keywords.some((keyword) => normalizedRequested.includes(keyword))
  );

  if (matcherEntry) {
    const keywordMatch = selectableStreams.find((stream) => {
      const normalizedStream = normalizeFacetKey(stream);
      return matcherEntry.some((keyword) => normalizedStream.includes(keyword));
    });

    if (keywordMatch) return keywordMatch;
  }

  return "All";
};

const FACET_PLACEHOLDER_VALUES = new Set([
  "n/a",
  "na",
  "not available",
  "not applicable",
  "nil",
  "none",
  "null",
  "undefined",
]);

const MONEY_LIKE_FACET_PATTERN =
  /(?:\u20B9|\binr\b|\brs\.?\b|\brupees?\b)|(?:\b\d{1,3}(?:,\d{2,3}){1,}(?:\.\d+)?\b)|(?:\b\d+(?:\.\d+)?\s*(?:lpa|lakh|lakhs|lac|crore|crores|cr|million|mn|thousand|k)\b)/i;

const isNoiseFacetValue = (value = "") => {
  const normalized = value.toLowerCase().replace(/\s+/g, " ").trim();

  if (!normalized || FACET_PLACEHOLDER_VALUES.has(normalized)) {
    return true;
  }

  return MONEY_LIKE_FACET_PATTERN.test(value);
};

type FilterChipType = "stream" | "level" | "mode";

type FilterChip = {
  type: FilterChipType;
  value: string;
  label: string;
  active: boolean;
  count: number;
};

const getFacetChipPreview = (
  chips: FilterChip[],
  limit: number,
  activeValue: string
) => {
  if (chips.length <= limit) {
    return { visible: chips, hidden: [] as FilterChip[] };
  }

  const activeChip = chips.find((chip) => chip.value === activeValue);
  let visible = chips.slice(0, limit);

  if (activeChip && !visible.some((chip) => chip.value === activeChip.value)) {
    visible = [...chips.slice(0, Math.max(0, limit - 1)), activeChip];
  }

  const visibleValues = new Set(visible.map((chip) => chip.value));

  return {
    visible,
    hidden: chips.filter((chip) => !visibleValues.has(chip.value)),
  };
};

const isPostgraduateValue = (value = "") => {
  const normalized = normalizeFacetKey(value);
  return [
    "postgraduate",
    "postgraduation",
    "pg",
    "master",
    "masters",
    "mba",
    "pgdm",
    "mtech",
    "msc",
    "mcom",
    "ma",
    "mca",
    "llm",
  ].some((keyword) => normalized.includes(keyword));
};

const isDoctoralValue = (value = "") => {
  const normalized = normalizeFacetKey(value);
  return [
    "doctoral",
    "doctorate",
    "phd",
    "postdoctoral",
    "postdoctorate",
    "dphil",
    "mphil",
  ].some((keyword) => normalized.includes(keyword));
};

const isUndergraduateValue = (value = "") => {
  const normalized = normalizeFacetKey(value);
  return [
    "undergraduate",
    "undergraduation",
    "ug",
    "bachelor",
    "btech",
    "be",
    "bba",
    "bcom",
    "ba",
    "bsc",
    "bca",
    "mbbs",
    "bds",
    "llb",
  ].some((keyword) => normalized.includes(keyword));
};

const isCertificateValue = (value = "") => {
  const normalized = normalizeFacetKey(value);
  return [
    "certificate",
    "certification",
    "certified",
    "diploma",
    "cert",
  ].some((keyword) => normalized.includes(keyword));
};

const normalizeCourseLevelValue = (value = ""): NormalizedCourseLevel | null => {
  if (isNoiseFacetValue(value)) return null;
  if (isDoctoralValue(value)) return "Doctoral";
  if (isPostgraduateValue(value)) return "Postgraduate";
  if (isUndergraduateValue(value)) return "Undergraduate";
  if (isCertificateValue(value)) return "Certificate";
  return null;
};

const LEVEL_FILTER_ORDER: NormalizedCourseLevel[] = [
  "Postgraduate",
  "Undergraduate",
  "Doctoral",
  "Certificate",
];

const getCourseSectionKey = (course: any): CourseSectionKey => {
  const levelValues = [...(course?.levels || []), course?.level, course?.name]
    .map((value) => (typeof value === "string" ? normalizeCourseLevelValue(value) : null))
    .filter((value): value is NormalizedCourseLevel => Boolean(value));

  if (levelValues.includes("Postgraduate")) {
    return "postgraduate";
  }

  if (levelValues.includes("Undergraduate")) {
    return "undergraduate";
  }

  return "popular";
};

const getSectionIdForLevel = (level = "") => {
  const normalizedLevel = normalizeCourseLevelValue(level);

  if (normalizedLevel === "Postgraduate") {
    return "courses-postgraduate";
  }

  if (normalizedLevel === "Undergraduate") {
    return "courses-undergraduate";
  }

  return "courses-popular";
};

const COURSE_SECTION_CONFIG = [
  {
    key: "postgraduate" as CourseSectionKey,
    title: "Postgraduate Programs in India 2026",
    seoDesc: "Top MBA, PGDM, M.Tech, MCA, M.Sc & LLM courses — fees, eligibility & top colleges",
    linkLabel: "View all PG courses →",
    sectionId: "courses-postgraduate",
    desktopLayout: "grid" as const,
  },
  {
    key: "undergraduate" as CourseSectionKey,
    title: "Undergraduate Programs in India 2026",
    seoDesc: "B.Tech, BBA, BCA, MBBS, B.Com, LLB & BA courses — admission, fees & colleges",
    linkLabel: "View all UG courses →",
    sectionId: "courses-undergraduate",
    desktopLayout: "list" as const,
  },
  {
    key: "popular" as CourseSectionKey,
    title: "Popular & Trending Courses 2026",
    seoDesc: "High-demand programs with best career scope, placement packages & top recruiters",
    linkLabel: "View all popular courses →",
    sectionId: "courses-popular",
    desktopLayout: "list" as const,
  },
];

const COURSES_PAGE_TESTIMONIALS = [
  {
    quote:
      "I scored 63 percentile in CAT and thought my MBA dream was over. StudyCups gave me a list of 12 great PGDM colleges I didn't know existed.",
    name: "Rohit Verma",
    meta: "MBA Admission - Batch 2025",
    initial: "R",
  },
  {
    quote:
      "The MBA admission process felt confusing at first, but the counsellor made everything clear from shortlist to final application.",
    name: "Ananya Mishra",
    meta: "PGDM Counselling - Lucknow",
    initial: "A",
  },
  {
    quote:
      "They shortlisted the right colleges within our budget and handled the process professionally. It saved a lot of time.",
    name: "Suresh Sharma",
    meta: "BBA Admission - Delhi",
    initial: "S",
  },
];

const CoursesPage: React.FC<CoursesPageProps> = ({
 
  initialStream,
}) => { 
    const API_BASE = "https://studycupsbackend-wb8p.onrender.com/api";
   const navigate = useNavigate();

const [courses, setCourses] = useState<any[]>([]);
const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(""); 
  const [selectedStream, setSelectedStream] = useState("All");
const [selectedLevel, setSelectedLevel] = useState("All");
  const [selectedMode, setSelectedMode] = useState("All");
  const [showMobileFilters, setShowMobileFilters] = useState(false); 
  const [expandedDesktopFacet, setExpandedDesktopFacet] = useState<FilterChipType | null>(null);
  const [sectionPages, setSectionPages] = useState<Record<CourseSectionKey, number>>({
    postgraduate: 1,
    undergraduate: 1,
    popular: 1,
  });
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const desktopFacetRef = useRef<HTMLDivElement | null>(null);




const location = useLocation();

useEffect(() => {
  setSectionPages({
    postgraduate: 1,
    undergraduate: 1,
    popular: 1,
  });
}, [searchTerm, selectedStream, selectedLevel, selectedMode]);

useEffect(() => {
  const updateViewport = () => {
    setIsMobileViewport(window.innerWidth < 768);
  };

  updateViewport();
  window.addEventListener("resize", updateViewport);

  return () => {
    window.removeEventListener("resize", updateViewport);
  };
}, []);

useEffect(() => {
  if (!expandedDesktopFacet) return;

  const handlePointerDown = (event: MouseEvent) => {
    if (
      desktopFacetRef.current &&
      !desktopFacetRef.current.contains(event.target as Node)
    ) {
      setExpandedDesktopFacet(null);
    }
  };

  const handleEscape = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      setExpandedDesktopFacet(null);
    }
  };

  document.addEventListener("mousedown", handlePointerDown);
  document.addEventListener("keydown", handleEscape);

  return () => {
    document.removeEventListener("mousedown", handlePointerDown);
    document.removeEventListener("keydown", handleEscape);
  };
}, [expandedDesktopFacet]);



const deriveStream = (courseName: string) => {
  const name = courseName.toLowerCase();
 


  /* ---------- DOCTORAL ---------- */
  if (
    name.includes("ph.d") ||
    name.includes("phd") ||
    name.includes("post doctoral") ||
    name.includes("doctoral")
  ) {
    return "Doctoral";
  }

  /* ---------- MANAGEMENT ---------- */
  if (
    name.includes("mba") ||
    name.includes("pgdm") ||
    name.includes("management") ||
    name.includes("leadership") ||
    name.includes("strategy") ||
    name.includes("executive")
  ) {
    return "Management";
  }

  /* ---------- ENGINEERING / TECH ---------- */
  if (
    name.includes("b.tech") ||
    name.includes("btech") ||
    name.includes("engineering") ||
    name.includes("technology") ||
    name.includes("data science") ||
    name.includes("artificial intelligence") ||
    name.includes("machine learning") ||
    name.includes("computer") ||
    name.includes("m.sc") ||
    name.includes("msc")
  ) {
    return "Engineering";
  }

  /* ---------- MEDICAL ---------- */
  if (
    name.includes("mbbs") ||
    name.includes("medical") ||
    name.includes("healthcare")
  ) {
    return "Medical";
  }

  /* ---------- COMMERCE ---------- */
  if (
    name.includes("b.com") ||
    name.includes("commerce") ||
    name.includes("account") ||
    name.includes("finance")
  ) {
    return "Commerce";
  }

  /* ---------- ARTS / SOCIAL ---------- */
  if (
    name.includes("arts") ||
    name.includes("humanities") ||
    name.includes("social")
  ) {
    return "Arts";
  }

  return "General";
};

const normalizeFacetValues = (value: any): string[] => {
  const values = Array.isArray(value) ? value : [value];
  const seen = new Set<string>();

  return values
    .map((item) =>
      typeof item === "string" ? item.trim().replace(/\s+/g, " ") : ""
    )
    .filter((item) => !isNoiseFacetValue(item))
    .filter((item) => {
      const key = item.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
};

const mergeFacetValues = (...groups: string[][]): string[] =>
  Array.from(new Set(groups.flat().filter(Boolean)));

const getBackendCourseStreams = (course: any) =>
  mergeFacetValues(
    normalizeFacetValues(course?.stream),
    normalizeFacetValues(course?.streams),
    normalizeFacetValues(course?.course_stream),
    normalizeFacetValues(course?.stream_name),
    normalizeFacetValues(course?.category),
    normalizeFacetValues(course?.course_category)
  );

const getBackendCourseLevels = (course: any) =>
  Array.from(
    new Set(
      mergeFacetValues(
        normalizeFacetValues(course?.course_level),
        normalizeFacetValues(course?.level),
        normalizeFacetValues(course?.levels)
      )
        .map((value) => normalizeCourseLevelValue(value))
        .filter((value): value is NormalizedCourseLevel => Boolean(value))
    )
  );

const getBackendCourseModes = (course: any) =>
  mergeFacetValues(
    normalizeFacetValues(course?.mode),
    normalizeFacetValues(course?.study_mode)
  );

const getPrimaryFacetValue = (values: string[], fallback = "N/A") =>
  values[0] || fallback;

const getCategorySlugFromStream = (courseName: string) => {
  return deriveStream(courseName)
    .toLowerCase()
    .replace(/\s+/g, "-");
};
function formatToLakhs(num) {
  if (!num) return "N/A";

  let lakhs = num / 100000;

  // keep 2 decimals max (20.75)
  lakhs = Math.round(lakhs * 100) / 100;

  return "₹" + lakhs + " Lakhs";
}

const normalizeCourseCard = (course: any) => {
  const name = course?.course_name || course?.name || "";
  const slug = course?.slug || toCourseSlug(name);
  const rawFees = Number(course?.avg_fees ?? course?.fees ?? 0);
  const totalColleges = Number(course?.totalColleges ?? course?.total_college_count ?? 0);
  const derivedStream = deriveStream(name);
  const backendStreams = getBackendCourseStreams(course);
  const levelValues = getBackendCourseLevels(course);
  const derivedLevel = normalizeCourseLevelValue(name);
  const modeValues = getBackendCourseModes(course);
  const filterStreams = backendStreams.length ? backendStreams : [derivedStream];
  const matchableStreams = mergeFacetValues(filterStreams, [derivedStream]);
  const filterLevels = levelValues.length
    ? levelValues
    : derivedLevel
      ? [derivedLevel]
      : [];

  return {
    ...course,
    courseKey: slug || name,
    slug,
    name,
    stream: getPrimaryFacetValue(filterStreams, derivedStream),
    streams: matchableStreams,
    filterStreams,
    levels: filterLevels,
    modes: modeValues,
    level: getPrimaryFacetValue(filterLevels),
    mode: getPrimaryFacetValue(modeValues),
    duration: course?.duration || "N/A",
    fees: Number.isFinite(rawFees) ? rawFees : 0,
    totalColleges: Number.isFinite(totalColleges) ? totalColleges : 0,
  };
};

  /* ================= ALL COURSES ================= */
useEffect(() => {
  setLoading(true);

  fetch(`${API_BASE}/main-course-card`)
    .then(res => res.json())
    .then(json => {
      const normalizedCourses = Array.isArray(json?.data)
        ? json.data.map((course: any) => normalizeCourseCard(course))
        : [];

      setCourses(normalizedCourses);
    })
    .catch(err => {
    })
    .finally(() => setLoading(false));
}, []);


  /* ================= GROUP ================= */


const streams = useMemo(() => {
  const set = new Set<string>();
  courses.forEach(c => {
    (c.filterStreams || []).forEach((stream: string) => set.add(stream));
  });
  return ["All", ...Array.from(set)];
}, [courses]);

useEffect(() => {
  const navState =
    location.state && typeof location.state === "object"
      ? (location.state as any)
      : null;
  const requestedStream =
    new URLSearchParams(location.search).get("stream") ||
    navState?.initialStream ||
    initialStream ||
    "";

  if (!requestedStream) return;

  const resolvedStream = resolveRequestedStream(requestedStream, streams);
  setSelectedStream(resolvedStream);
}, [initialStream, location.search, location.state, streams]);


const levels = useMemo(() => {
  const availableLevels = LEVEL_FILTER_ORDER.filter((level) =>
    courses.some((course) => (course.levels || []).includes(level))
  );

  return ["All", ...availableLevels];
}, [courses]);

const modes = useMemo(() => {
  const set = new Set<string>();
  courses.forEach(c => {
    (c.modes || []).forEach((mode: string) => set.add(mode));
  });
  return ["All", ...Array.from(set)];
}, [courses]);

const searchTokens = useMemo(() => tokenize(searchTerm), [searchTerm]);

const getSearchText = (course) => {
  return normalizeText(
    [
      course.name,
      course.level,
      course.mode,
      course.stream,
      ...(course.streams || []),
      ...(course.levels || []),
      ...(course.modes || []),
      "phd",
      "doctoral",
      course.name?.includes("Working") ? "working professional part time wp" : "",
      course.name?.includes("Executive") ? "executive management" : "",
    ].join(" ")
  );
};

const searchMatchedCourses = useMemo(() => {
  return courses.filter((course) => {
    const searchable = getSearchText(course);

    return (
      searchTokens.length === 0 ||
      searchTokens.every(token => searchable.includes(token))
    );
  });
}, [courses, searchTokens]);

const matchesFacetFilters = (
  course: any,
  filters: { stream: string; level: string; mode: string }
) => {
  const streamMatch =
    filters.stream === "All" ||
    (course.streams || []).includes(filters.stream) ||
    deriveStream(course.name) === filters.stream;

  const levelMatch =
    filters.level === "All" || (course.levels || []).includes(filters.level);

  const modeMatch =
    filters.mode === "All" || (course.modes || []).includes(filters.mode);

  return streamMatch && levelMatch && modeMatch;
};


 const filteredCourses = useMemo(() => { 
  return searchMatchedCourses.filter((c) => {
    return matchesFacetFilters(c, {
      stream: selectedStream,
      level: selectedLevel,
      mode: selectedMode,
    });
  });
}, [searchMatchedCourses, selectedStream, selectedLevel, selectedMode]);


  const clearFilters = () => {
    setSelectedStream("All");
    setSelectedLevel("All");
    setSelectedMode("All");
  };
 const getCourseCategorySlug = (courseName: string) => {
  const category = deriveStream(courseName);

  return category
    .toLowerCase()
    .replace(/\s+/g, "-"); // management Ã¢â€ â€™ management
};
const buildFilterChips = (
  values: string[],
  type: FilterChipType
): FilterChip[] => {
  return values
    .filter(value => value !== "All")
    .map((value) => ({
      type,
      value,
      label: value,
      active:
        type === "stream"
          ? selectedStream === value
          : type === "level"
            ? selectedLevel === value
            : selectedMode === value,
      count: searchMatchedCourses.filter((course) =>
        matchesFacetFilters(course, {
          stream: type === "stream" ? value : selectedStream,
          level: type === "level" ? value : selectedLevel,
          mode: type === "mode" ? value : selectedMode,
        })
      ).length,
    }))
    .filter(chip => chip.count > 0);
};

const streamFilterChips = useMemo(
  () => buildFilterChips(streams, "stream"),
  [streams, searchMatchedCourses, selectedStream, selectedLevel, selectedMode]
);

const levelFilterChips = useMemo(
  () => buildFilterChips(levels, "level"),
  [levels, searchMatchedCourses, selectedStream, selectedLevel, selectedMode]
);

const modeFilterChips = useMemo(
  () => buildFilterChips(modes, "mode"),
  [modes, searchMatchedCourses, selectedStream, selectedLevel, selectedMode]
);

const streamChipPreview = useMemo(
  () => getFacetChipPreview(streamFilterChips, 3, selectedStream),
  [streamFilterChips, selectedStream]
);

const modeChipPreview = useMemo(
  () => getFacetChipPreview(modeFilterChips, 3, selectedMode),
  [modeFilterChips, selectedMode]
);

const levelChipPreview = useMemo(
  () => getFacetChipPreview(levelFilterChips, 2, selectedLevel),
  [levelFilterChips, selectedLevel]
);

const expandedDesktopFacetConfig =
  expandedDesktopFacet === "stream"
    ? {
        chips: streamChipPreview.hidden,
        onSelect: (value: string) => setSelectedStream(selectedStream === value ? "All" : value),
      }
    : expandedDesktopFacet === "mode"
      ? {
          chips: modeChipPreview.hidden,
          onSelect: (value: string) => setSelectedMode(selectedMode === value ? "All" : value),
        }
      : expandedDesktopFacet === "level"
        ? {
            chips: levelChipPreview.hidden,
            onSelect: (value: string) => setSelectedLevel(selectedLevel === value ? "All" : value),
          }
        : null;

const getCourseCardDescription = (course: any) => {
  const customDescription = [
    course?.short_description,
    course?.description,
    course?.overview,
    course?.summary,
  ].find((value) => typeof value === "string" && value.trim());

  if (customDescription) {
    return customDescription.trim();
  }

  const introParts = [course?.level, course?.mode]
    .filter((value) => value && value !== "N/A")
    .join(" ");
  const intro = introParts ? `${introParts} program` : "Career-focused program";
  const duration = course?.duration && course.duration !== "N/A"
    ? `${course.duration} duration`
    : "expert-led admissions support";
  const colleges = course?.totalColleges
    ? `across ${course.totalColleges}+ partner colleges`
    : "with expert counselling support";

  return `${intro} with ${duration}, shortlisting guidance, and admission support ${colleges}.`;
};

const getCourseCardTags = (course: any) =>
  [course?.stream, course?.mode, course?.level]
    .filter((value) => value && value !== "N/A")
    .slice(0, 4);

const getCourseBadgeLabel = (course: any) =>
  course?.totalColleges
    ? `In ${course.totalColleges}+ Colleges`
    : "Popular Choice";

const getWideCourseBadgeLabel = (course: any) => {
  const labels = ["High Demand", "New Batches", "Creative Track", "Top Picks"];
  return labels[hashIndex(course?.courseKey || course?.name || "course") % labels.length];
};

const getWideCourseHighlights = (course: any) =>
  Array.from(
    new Set(
      [
        ...getCourseCardTags(course),
        course?.duration && course.duration !== "N/A" ? course.duration : "",
        course?.totalColleges ? `${course.totalColleges}+ Colleges` : "",
      ].filter(Boolean)
    )
  ).slice(0, 4);

const groupedSectionCourses = useMemo(
  () =>
    filteredCourses.reduce(
      (sections, course) => {
        sections[getCourseSectionKey(course)].push(course);
        return sections;
      },
      {
        postgraduate: [] as any[],
        undergraduate: [] as any[],
        popular: [] as any[],
      }
    ),
  [filteredCourses]
);

const sectionViews = useMemo(
  () =>
    COURSE_SECTION_CONFIG.map((section) => {
      const itemsPerPage = isMobileViewport
        ? 4
        : section.desktopLayout === "grid"
          ? 4
          : 3;
      const sectionCourses = groupedSectionCourses[section.key];
      const rawTotalPages = Math.ceil(sectionCourses.length / itemsPerPage);
      const totalPages = rawTotalPages > 0 ? rawTotalPages : 1;
      const currentPage = Math.min(sectionPages[section.key] || 1, totalPages);
      const startIndex = (currentPage - 1) * itemsPerPage;

      return {
        ...section,
        itemsPerPage,
        courses: sectionCourses,
        currentPage,
        totalPages,
        pagedCourses: sectionCourses.slice(startIndex, startIndex + itemsPerPage),
      };
    }),
  [groupedSectionCourses, isMobileViewport, sectionPages]
);

useEffect(() => {
  if (selectedLevel === "All") {
    return;
  }

  const targetId = getSectionIdForLevel(selectedLevel);
  const timer = window.setTimeout(() => {
    const element = document.getElementById(targetId);

    if (!element) {
      return;
    }

    const nextTop = element.getBoundingClientRect().top + window.scrollY - 148;
    window.scrollTo({ top: Math.max(nextTop, 0), behavior: "smooth" });
  }, 120);

  return () => {
    window.clearTimeout(timer);
  };
}, [selectedLevel, filteredCourses.length]);

const getCourseLink = (course: any) => {
  const categorySlug = getCourseCategorySlug(course.name);
  const courseSlug = course.slug || toCourseSlug(course.name);
  return buildCourseDetailPath(categorySlug, course.name, courseSlug);
};

/* ── Stream → gradient map ── */
const STREAM_GRADIENT: Record<string, string> = {
  Management:  "from-blue-600 to-indigo-700",
  Engineering: "from-violet-600 to-indigo-700",
  Medical:     "from-red-500 to-rose-700",
  Law:         "from-emerald-600 to-teal-700",
  Commerce:    "from-amber-500 to-orange-600",
  Design:      "from-pink-500 to-fuchsia-700",
  Doctoral:    "from-slate-600 to-slate-800",
  General:     "from-sky-500 to-cyan-700",
};
const getStreamGradient = (stream = "") => {
  const key = Object.keys(STREAM_GRADIENT).find(
    (k) => stream.toLowerCase().includes(k.toLowerCase())
  );
  return key ? STREAM_GRADIENT[key] : STREAM_GRADIENT.General;
};

const renderCompactCourseCard = (course: any) => {
  const courseLink = getCourseLink(course);
  const courseTags = getCourseCardTags(course);
  const grad = getStreamGradient(course.stream || deriveStream(course.name));

  return (
    <article
      key={course.courseKey}
      onClick={() => navigate(courseLink)}
      className="group flex h-full cursor-pointer flex-col overflow-hidden rounded-2xl bg-white border border-slate-100 shadow-[0_4px_24px_rgba(10,33,74,0.08)] hover:shadow-[0_14px_40px_rgba(10,33,74,0.16)] hover:-translate-y-1 transition-all duration-300"
      aria-label={`${course.name} – ${course.stream || "General"} course in India 2026`}
    >
      {/* Gradient top accent bar */}
      <div className={`h-1.5 w-full bg-gradient-to-r ${grad} flex-shrink-0`} />

      <div className="flex flex-col flex-1 p-4 gap-0">
        {/* Icon + badge row */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${grad} text-white shadow-md flex-shrink-0`}>
            <GraduationCap className="h-5 w-5" strokeWidth={2} />
          </div>
          <span className="rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-[10px] font-bold text-amber-700 leading-none mt-1">
            {getCourseBadgeLabel(course)}
          </span>
        </div>

        {/* Stream label */}
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400 mb-1">
          {course.stream || "General Program"}
        </p>

        {/* Course name */}
        <h3 className="text-[15px] font-bold leading-snug text-slate-800 line-clamp-2 mb-2">
          {course.name}
        </h3>

        {/* Description */}
        <p className="text-[12px] leading-5 text-slate-500 line-clamp-3 flex-1">
          {getCourseCardDescription(course)}
        </p>

        {/* Tags */}
        {courseTags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {courseTags.slice(0, 3).map((tag) => (
              <span
                key={`${course.courseKey}-${tag}`}
                className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-medium text-slate-600"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 border-t border-slate-100 bg-slate-50/80">
        <div className="flex flex-col items-center py-2.5 border-r border-slate-100">
          <span className="text-[13px] font-extrabold text-[#1f4fa8]">{course.totalColleges || 0}+</span>
          <span className="text-[9px] uppercase tracking-wide text-slate-400 mt-0.5">Colleges</span>
        </div>
        <div className="flex flex-col items-center py-2.5 border-r border-slate-100">
          <span className="text-[11px] font-extrabold text-slate-700 truncate max-w-[80px] text-center">
            {course.duration && course.duration !== "N/A" ? course.duration : "—"}
          </span>
          <span className="text-[9px] uppercase tracking-wide text-slate-400 mt-0.5">Duration</span>
        </div>
        <div className="flex flex-col items-center py-2.5">
          <span className="text-[11px] font-extrabold text-slate-700 truncate max-w-[70px] text-center">
            {course.level && course.level !== "N/A" ? course.level : "—"}
          </span>
          <span className="text-[9px] uppercase tracking-wide text-slate-400 mt-0.5">Level</span>
        </div>
      </div>

      {/* CTA row */}
      <div className="flex gap-2 p-3 border-t border-slate-100">
        <button
          onClick={(e) => { e.stopPropagation(); navigate(courseLink); }}
          className={`flex-1 rounded-xl bg-gradient-to-r ${grad} py-2.5 text-[12px] font-bold text-white shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all`}
        >
          Explore Course →
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); navigate(courseLink); }}
          aria-label={`View details of ${course.name}`}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 hover:text-[#1f4fa8] hover:border-[#1f4fa8]/30 transition"
        >
          <ArrowRight className="h-4 w-4" strokeWidth={2} />
        </button>
      </div>
    </article>
  );
};

const renderWideCourseCard = (course: any) => {
  const courseLink = getCourseLink(course);
  const courseHighlights = getWideCourseHighlights(course);
  const grad = getStreamGradient(course.stream || deriveStream(course.name));

  return (
    <article
      key={course.courseKey}
      onClick={() => navigate(courseLink)}
      className="group flex cursor-pointer items-stretch rounded-2xl bg-white border border-slate-100 shadow-[0_4px_20px_rgba(10,33,74,0.07)] hover:shadow-[0_12px_36px_rgba(10,33,74,0.14)] hover:-translate-y-0.5 transition-all duration-300 overflow-hidden"
      aria-label={`${course.name} – ${course.stream || "General"} course in India 2026`}
    >
      {/* Gradient left accent bar */}
      <div className={`w-1.5 shrink-0 bg-gradient-to-b ${grad}`} />

      <div className="flex flex-1 min-w-0 items-center justify-between gap-5 px-5 py-4">
        {/* Left: icon + content */}
        <div className="flex min-w-0 flex-1 gap-4 items-start">
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${grad} text-white shadow-md`}>
            <GraduationCap className="h-5 w-5" strokeWidth={2} />
          </div>

          <div className="min-w-0 flex-1">
            {/* Stream + demand badge */}
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                {course.stream || "General Program"}
              </span>
              <span className="rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[9px] font-bold text-amber-700">
                {getWideCourseBadgeLabel(course)}
              </span>
            </div>

            {/* Course name */}
            <h3 className="text-[16px] md:text-[19px] font-bold leading-snug text-slate-800 line-clamp-1 mb-1.5">
              {course.name}
            </h3>

            {/* Description */}
            <p className="text-[12px] md:text-[13px] leading-relaxed text-slate-500 line-clamp-2 max-w-[680px]">
              {getCourseCardDescription(course)}
            </p>

            {/* Highlights */}
            {courseHighlights.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                {courseHighlights.slice(0, 4).map((item) => (
                  <span
                    key={`${course.courseKey}-${item}`}
                    className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600"
                  >
                    <span className={`h-1.5 w-1.5 rounded-full bg-gradient-to-r ${grad}`} />
                    {item}
                  </span>
                ))}
              </div>
            )}

            {/* Quick stats chips */}
            <div className="mt-2.5 flex items-center gap-3 flex-wrap">
              {course.totalColleges > 0 && (
                <span className="rounded-full bg-blue-50 border border-blue-100 px-2.5 py-0.5 text-[10px] font-bold text-blue-700">
                  {course.totalColleges}+ Colleges
                </span>
              )}
              {course.duration && course.duration !== "N/A" && (
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-semibold text-slate-600">
                  {course.duration}
                </span>
              )}
              {course.level && course.level !== "N/A" && (
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-semibold text-slate-600">
                  {course.level}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: CTA */}
        <div className="shrink-0 flex flex-col items-end justify-center">
          <button
            onClick={(e) => { e.stopPropagation(); navigate(courseLink); }}
            className={`rounded-xl bg-gradient-to-r ${grad} px-5 py-2.5 text-[12px] font-bold text-white shadow hover:shadow-lg hover:-translate-y-0.5 transition-all whitespace-nowrap`}
          >
            Explore Course →
          </button>
        </div>
      </div>
    </article>
  );
};

const renderSectionPagination = (
  sectionKey: CourseSectionKey,
  currentPage: number,
  totalPages: number
) => {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="mt-8 flex justify-center">
      <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <button
          type="button"
          disabled={currentPage === 1}
          onClick={() =>
            setSectionPages((previous) => ({
              ...previous,
              [sectionKey]: Math.max(1, currentPage - 1),
            }))
          }
          className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
            currentPage === 1
              ? "cursor-not-allowed bg-slate-100 text-slate-400"
              : "text-[#0A225A] hover:bg-blue-50"
          }`}
        >
          Previous
        </button>

        <div className="min-w-[110px] rounded-lg bg-slate-100 px-4 py-2 text-center text-sm font-bold text-slate-700">
          Page {currentPage} <span className="text-slate-400">of</span> {totalPages}
        </div>

        <button
          type="button"
          disabled={currentPage === totalPages}
          onClick={() =>
            setSectionPages((previous) => ({
              ...previous,
              [sectionKey]: Math.min(totalPages, currentPage + 1),
            }))
          }
          className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
            currentPage === totalPages
              ? "cursor-not-allowed bg-slate-100 text-slate-400"
              : "text-[#0A225A] hover:bg-blue-50"
          }`}
        >
          Next
        </button>
      </div>
    </div>
  );
};
  return (
    <div className="bg-[#f5f7fb] min-h-screen">
      <Helmet>
        {/* ── Primary SEO ── */}
        <title>
          {selectedStream && selectedStream !== "All"
            ? `Best ${selectedStream} Courses in India 2026 – Fees, Syllabus, Top Colleges | StudyCups`
            : "All Courses in India 2026 – MBA, B.Tech, MBBS, BCA, BBA, Law | StudyCups"}
        </title>
        <meta name="description" content={
          selectedStream && selectedStream !== "All"
            ? `Explore best ${selectedStream} courses in India 2026. Compare fees, syllabus, NIRF-ranked colleges, eligibility criteria, entrance exams and career scope. Free expert counselling on StudyCups.`
            : "Browse 50+ courses in India 2026 – MBA, B.Tech, MBBS, BCA, BBA, Law, Design & more. Compare fees, top NIRF-ranked colleges, syllabus, eligibility and career options. Free counselling on StudyCups."
        } />
        <meta name="keywords" content={
          selectedStream && selectedStream !== "All"
            ? `${selectedStream} courses India 2026, best ${selectedStream} colleges, ${selectedStream} fees syllabus, ${selectedStream} eligibility, ${selectedStream} admission 2026, ${selectedStream} career scope, top ${selectedStream} colleges NIRF, free counselling ${selectedStream}`
            : "courses in India 2026, MBA courses India, B.Tech courses, MBBS colleges 2026, BCA BBA courses, law colleges India, best courses after 12th, college admission 2026, NIRF ranked colleges, free counselling StudyCups, compare course fees"
        } />
        <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large" />
        <meta name="author" content="StudyCups" />
        <link rel="canonical" href="https://studycups.in/courses" />

        {/* ── Open Graph ── */}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="StudyCups" />
        <meta property="og:locale" content="en_IN" />
        <meta property="og:title" content={
          selectedStream && selectedStream !== "All"
            ? `Best ${selectedStream} Courses in India 2026 – Fees, Colleges | StudyCups`
            : "All Courses in India 2026 – MBA, B.Tech, MBBS, BCA, BBA | StudyCups"
        } />
        <meta property="og:description" content="Compare 50+ courses by fees, top colleges, syllabus & career scope. Free expert counselling for 2026 admissions." />
        <meta property="og:url" content="https://studycups.in/courses" />
        <meta property="og:image" content="https://studycups.in/logos/StudyCups.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />

        {/* ── Twitter Card ── */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@StudyCups" />
        <meta name="twitter:title" content={
          selectedStream && selectedStream !== "All"
            ? `Best ${selectedStream} Courses in India 2026 | StudyCups`
            : "All Courses in India 2026 – MBA, B.Tech, MBBS & More | StudyCups"
        } />
        <meta name="twitter:description" content="Browse MBA, B.Tech, MBBS, BCA, Law courses. Compare fees, top colleges, syllabus & get free admission guidance." />
        <meta name="twitter:image" content="https://studycups.in/logos/StudyCups.png" />

        {/* ── JSON-LD: ItemList of courses ── */}
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "ItemList",
          "name": selectedStream && selectedStream !== "All"
            ? `Best ${selectedStream} Courses in India 2026`
            : "All Courses in India 2026",
          "description": "Compare top courses in India by fees, colleges, eligibility and career scope.",
          "url": "https://studycups.in/courses",
          "numberOfItems": filteredCourses.length,
          "itemListElement": filteredCourses.slice(0, 10).map((c: any, idx: number) => ({
            "@type": "ListItem",
            "position": idx + 1,
            "name": c.name || "",
            "url": `https://studycups.in/courses/${c.slug || toCourseSlug(c.name || "")}`,
            "description": getCourseCardDescription(c),
          }))
        })}</script>

        {/* ── JSON-LD: BreadcrumbList ── */}
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://studycups.in/" },
            { "@type": "ListItem", "position": 2, "name": "Courses & Programs", "item": "https://studycups.in/courses" },
            ...(selectedStream && selectedStream !== "All"
              ? [{ "@type": "ListItem", "position": 3, "name": selectedStream, "item": `https://studycups.in/courses?stream=${encodeURIComponent(selectedStream)}` }]
              : [])
          ]
        })}</script>

        {/* ── JSON-LD: EducationalOrganization ── */}
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "EducationalOrganization",
          "name": "StudyCups",
          "url": "https://studycups.in",
          "logo": "https://studycups.in/logos/StudyCups.png",
          "description": "India's trusted college admission portal – MBA, B.Tech, MBBS, BCA, BBA, Law counselling & admissions.",
          "contactPoint": {
            "@type": "ContactPoint",
            "telephone": "+91-8081269969",
            "contactType": "Admissions Counselling",
            "areaServed": "IN",
            "availableLanguage": ["Hindi", "English"]
          },
          "sameAs": ["https://www.justdial.com/studycups"]
        })}</script>
      </Helmet>

{/* ═══════════════════════════════════════
    HERO — COURSES PAGE
═══════════════════════════════════════ */}
<section className="relative mt-6 md:mt-[100px] overflow-hidden">

  {/* ── Multi-layer gradient background ── */}
  <div className="absolute inset-0 bg-gradient-to-br from-[#030c1a] via-[#061528] to-[#0b2545]" />
  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(99,102,241,0.18)_0%,transparent_50%)]" />
  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(14,165,233,0.14)_0%,transparent_50%)]" />
  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(245,158,11,0.10)_0%,transparent_40%)]" />

  {/* Glow orbs */}
  <div className="pointer-events-none absolute -top-16 -left-12 h-56 w-56 rounded-full bg-indigo-500/20 blur-[80px]" />
  <div className="pointer-events-none absolute top-8 right-0 h-64 w-64 rounded-full bg-sky-400/15 blur-[90px]" />
  <div className="pointer-events-none absolute bottom-0 left-1/3 h-40 w-80 rounded-full bg-amber-400/10 blur-[70px]" />

  {/* Dot-grid pattern */}
  <div
    className="pointer-events-none absolute inset-0 opacity-[0.03]"
    style={{ backgroundImage: "radial-gradient(circle,#fff 1px,transparent 1px)", backgroundSize: "26px 26px" }}
  />

  <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 py-5 md:py-7">

    {/* Breadcrumb */}
    <nav aria-label="breadcrumb" className="flex items-center gap-1.5 text-[11px] text-white/40 mb-3">
      <a href="/" className="hover:text-white/70 transition">Home</a>
      <span>/</span>
      <span className="text-[#f3a11c] font-semibold">Courses &amp; Programs</span>
      {selectedStream && selectedStream !== "All" && (
        <><span>/</span><span className="text-white/60">{selectedStream}</span></>
      )}
    </nav>

    <div className="grid grid-cols-1 lg:grid-cols-[1fr_240px] gap-5 lg:gap-8 items-start">

      {/* ── LEFT ── */}
      <div>

        {/* Live badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-0.5 mb-2">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
          <span className="text-[10px] font-bold tracking-[0.12em] text-amber-300 uppercase">
            2026 Admissions Open · 500+ Partner Colleges
          </span>
        </div>

        {/* H1 */}
        <h1 className="text-[18px] sm:text-[26px] md:text-[34px] font-extrabold leading-[1.05] tracking-tight text-white">
          Explore&nbsp;
          <span className="relative inline-block">
            <span className="bg-gradient-to-r from-amber-300 via-orange-400 to-amber-500 bg-clip-text text-transparent">
              {selectedStream && selectedStream !== "All" ? selectedStream : "All Courses"}
            </span>
            <span className="absolute -bottom-1 left-0 right-0 h-[2px] rounded-full bg-gradient-to-r from-amber-400 to-orange-500 opacity-50" />
          </span>
          {" "}
          <span className="text-white/70 text-[15px] sm:text-[20px] md:text-[24px] font-semibold">
            in India 2026
          </span>
        </h1>

        {/* SEO subtext */}
        <p className="mt-1.5 max-w-[600px] text-xs md:text-sm leading-relaxed text-white/58">
          Compare MBA, B.Tech, MBBS, BCA, BBA, Law &amp; 50+ programs — fees,
          syllabus, NIRF rankings, eligibility &amp; career scope.
          Get&nbsp;<strong className="text-white/80 font-semibold">free expert counselling</strong>.
        </p>

        {/* ── Search bar ── */}
        <div className="mt-3 max-w-[500px]">
          <div className="relative flex items-center">
            <svg className="absolute left-3.5 w-4 h-4 text-white/40 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="search"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search MBA, B.Tech, MBBS, Law, BCA..."
              className="h-10 w-full rounded-xl border border-white/15 bg-white/8 pl-10 pr-4 text-sm text-white placeholder:text-white/35 outline-none transition focus:border-amber-400/50 focus:bg-white/12 backdrop-blur"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 text-white/40 hover:text-white/70 transition text-xs"
              >✕</button>
            )}
          </div>
        </div>

        {/* ── Quick-stream chips ── */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {["All", "Management", "Engineering", "Medical", "Law", "Design", "Commerce"].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSelectedStream(s)}
              className={`rounded-full px-3 py-1 text-[10px] font-semibold border transition-all ${
                selectedStream === s
                  ? "bg-gradient-to-r from-amber-400 to-orange-500 border-amber-400 text-[#0a1e3a] shadow-[0_3px_10px_rgba(245,158,11,0.35)]"
                  : "border-white/15 bg-white/8 text-white/65 hover:bg-white/15 hover:text-white"
              }`}
            >
              {s === "All" ? "🎓 All" : s}
            </button>
          ))}
        </div>

        {/* Stats mini-row */}
        <div className="mt-3 flex flex-wrap gap-3">
          {[
            { icon: "🏛️", val: "500+", lbl: "Colleges" },
            { icon: "📚", val: "50+", lbl: "Programs" },
            { icon: "👨‍🎓", val: "5,000+", lbl: "Guided" },
            { icon: "⭐", val: "4.6/5", lbl: "Rating" },
          ].map(({ icon, val, lbl }) => (
            <div key={lbl} className="flex items-center gap-1.5">
              <span className="text-xs">{icon}</span>
              <div>
                <span className="text-[#f3a11c] font-extrabold text-xs">{val}</span>
                <span className="text-white/40 text-[10px] ml-1">{lbl}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── RIGHT: Stats card ── */}
      <div className="hidden lg:block">
        <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-4 shadow-[0_20px_50px_rgba(0,0,0,0.30)] backdrop-blur-xl">

          {/* Program count */}
          <div className="text-center mb-3">
            <p className="text-[2rem] font-extrabold leading-none bg-gradient-to-b from-amber-300 to-orange-500 bg-clip-text text-transparent">
              {loading ? "50+" : `${Math.max(filteredCourses.length, 50)}+`}
            </p>
            <p className="text-[12px] text-white/55 mt-0.5">
              {selectedStream && selectedStream !== "All" ? `${selectedStream} Courses` : "Total Programs Listed"}
            </p>
          </div>

          <div className="h-px bg-white/10 mb-3" />

          {/* Key stats */}
          <div className="space-y-2 text-[12px]">
            {[
              ["Partner Colleges", "500+"],
              ["Students Guided", "5,000+"],
              ["Justdial Rating", "4.6 / 5 ⭐"],
              ["Scholarship Up To", "₹1 Lakh"],
              ["Free Counselling", "Yes ✓"],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between gap-3">
                <span className="text-white/55">{label}</span>
                <span className="font-bold text-amber-400">{value}</span>
              </div>
            ))}
          </div>

          <div className="h-px bg-white/10 my-3" />

          {/* CTA */}
          <a
            href="tel:+918081269969"
            className="flex items-center justify-center gap-2 w-full rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 py-2 text-xs font-bold text-[#0a1e3a] shadow-[0_4px_16px_rgba(245,158,11,0.40)] hover:-translate-y-0.5 transition-all"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            Call for Free Guidance
          </a>
        </div>
      </div>
    </div>
  </div>

  {/* Wave bottom divider */}
  <div className="relative h-6 overflow-hidden">
    <svg viewBox="0 0 1440 24" className="absolute bottom-0 w-full" preserveAspectRatio="none">
      <path d="M0,24 L1440,24 L1440,6 Q1080,24 720,12 Q360,0 0,12 Z" fill="#f5f7fb" />
    </svg>
  </div>
</section>

<div className="hidden md:block sticky top-[74px] z-40 bg-white border-b border-slate-200 shadow-[0_4px_16px_rgba(10,33,74,0.07)]">
  <div className="max-w-7xl mx-auto px-6 py-2.5">
    <div ref={desktopFacetRef} className="flex flex-col gap-2.5">
        <div className="flex items-center gap-3 overflow-x-auto no-scrollbar">
          <span className="shrink-0 text-sm font-bold uppercase tracking-[0.08em] text-slate-500">
            Filter By:
          </span>

          <button
            onClick={() => {
              clearFilters();
              setExpandedDesktopFacet(null);
            }}
            className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition ${
              selectedStream === "All" && selectedLevel === "All" && selectedMode === "All"
                ? "border-[#0A225A] bg-[#0A225A] text-white"
                : "border-[#d8cfc0] bg-white text-slate-600 hover:border-[#0A225A]/30"
            }`}
          >
            All
          </button>

          {streamFilterChips.length > 0 && (
            <span className="shrink-0 text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">
              Stream
            </span>
          )}
          {streamChipPreview.visible.map((filter) => (
            <button
              key={`${filter.type}-${filter.value}`}
              onClick={() => {
                setSelectedStream(filter.active ? "All" : filter.value);
                setExpandedDesktopFacet(null);
              }}
              className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                filter.active
                  ? "border-[#0A225A] bg-[#0A225A] text-white"
                  : "border-[#d8cfc0] bg-white text-slate-600 hover:border-[#0A225A]/30"
              }`}
            >
              {filter.label}
            </button>
          ))}
          {streamChipPreview.hidden.length > 0 && (
            <button
              type="button"
              onClick={() =>
                setExpandedDesktopFacet(
                  expandedDesktopFacet === "stream" ? null : "stream"
                )
              }
              aria-label="More stream filters"
              className={`shrink-0 rounded-full border p-2 transition ${
                expandedDesktopFacet === "stream"
                  ? "border-[#0A225A] bg-[#0A225A] text-white"
                  : "border-[#d8cfc0] bg-white text-slate-600 hover:border-[#0A225A]/30"
              }`}
            >
              <ChevronDown
                className={`h-4 w-4 transition-transform duration-300 ${
                  expandedDesktopFacet === "stream" ? "rotate-180" : ""
                }`}
              />
            </button>
          )}

          {modeFilterChips.length > 0 && (
            <span className="shrink-0 text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">
              Mode
            </span>
          )}
          {modeChipPreview.visible.map((filter) => (
            <button
              key={`${filter.type}-${filter.value}`}
              onClick={() => {
                setSelectedMode(filter.active ? "All" : filter.value);
                setExpandedDesktopFacet(null);
              }}
              className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                filter.active
                  ? "border-[#0A225A] bg-[#0A225A] text-white"
                  : "border-[#d8cfc0] bg-white text-slate-600 hover:border-[#0A225A]/30"
              }`}
            >
              {filter.label}
            </button>
          ))}
          {modeChipPreview.hidden.length > 0 && (
            <button
              type="button"
              onClick={() =>
                setExpandedDesktopFacet(
                  expandedDesktopFacet === "mode" ? null : "mode"
                )
              }
              aria-label="More mode filters"
              className={`shrink-0 rounded-full border p-2 transition ${
                expandedDesktopFacet === "mode"
                  ? "border-[#0A225A] bg-[#0A225A] text-white"
                  : "border-[#d8cfc0] bg-white text-slate-600 hover:border-[#0A225A]/30"
              }`}
            >
              <ChevronDown
                className={`h-4 w-4 transition-transform duration-300 ${
                  expandedDesktopFacet === "mode" ? "rotate-180" : ""
                }`}
              />
            </button>
          )}

          {levelFilterChips.length > 0 && (
            <span className="shrink-0 text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">
              Level
            </span>
          )}
          {levelChipPreview.visible.map((filter) => (
            <button
              key={`${filter.type}-${filter.value}`}
              onClick={() => {
                setSelectedLevel(filter.active ? "All" : filter.value);
                setExpandedDesktopFacet(null);
              }}
              className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                filter.active
                  ? "border-[#0A225A] bg-[#0A225A] text-white"
                  : "border-[#d8cfc0] bg-white text-slate-600 hover:border-[#0A225A]/30"
              }`}
            >
              {filter.label}
            </button>
          ))}
          {levelChipPreview.hidden.length > 0 && (
            <button
              type="button"
              onClick={() =>
                setExpandedDesktopFacet(
                  expandedDesktopFacet === "level" ? null : "level"
                )
              }
              aria-label="More level filters"
              className={`shrink-0 rounded-full border p-2 transition ${
                expandedDesktopFacet === "level"
                  ? "border-[#0A225A] bg-[#0A225A] text-white"
                  : "border-[#d8cfc0] bg-white text-slate-600 hover:border-[#0A225A]/30"
              }`}
            >
              <ChevronDown
                className={`h-4 w-4 transition-transform duration-300 ${
                  expandedDesktopFacet === "level" ? "rotate-180" : ""
                }`}
              />
            </button>
          )}
        </div>

        {expandedDesktopFacetConfig && expandedDesktopFacetConfig.chips.length > 0 && (
          <div className="animate-slideUp rounded-[20px] border border-[#d8cfc0] bg-white/90 p-3 shadow-[0_10px_24px_rgba(15,32,62,0.08)]">
            <div className="flex flex-wrap gap-2">
              {expandedDesktopFacetConfig.chips.map((filter) => (
                <button
                  key={`${filter.type}-${filter.value}`}
                  onClick={() => {
                    expandedDesktopFacetConfig.onSelect(filter.value);
                    setExpandedDesktopFacet(null);
                  }}
                  className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                    filter.active
                      ? "border-[#0A225A] bg-[#0A225A] text-white"
                      : "border-[#d8cfc0] bg-[#f6f1e8] text-slate-600 hover:border-[#0A225A]/30"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
  </div>
</div>

{/* MOBILE FILTER BUTTON */}
<div className="md:hidden px-6 mt-4">
  <button
    onClick={() => setShowMobileFilters(true)}
    className=" 
      
      w-full
      py-3
      rounded-xl
      bg-transparent
      text-[#0A225A]
      font-semibold
      shadow-md
    "
  >
    Filters
  </button>
</div>





      <div className="  container mx-auto px-6 py-12"> 
       <div className="flex gap-8 items-start">
        {/* FILTERS */}
       {/* LEFT FILTER SIDEBAR (Desktop) */}
<aside className="hidden">
  <div className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden">

    {/* HEADER (Sticky inside sidebar) */}
  <div className="px-6 py-4 border-b bg-slate-50">
  <h3 className="text-sm font-extrabold tracking-wide text-slate-800">
    FILTERS
  </h3>
  <p className="text-xs text-slate-500 mt-1">
    Narrow down courses
  </p>
</div>


    {/* SCROLLABLE FILTER CONTENT */}
   <div className="px-6 py-5 space-y-8 max-h-[calc(100vh-220px)] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300">


      {/* STREAM */}
    <div>
  <h4 className="text-xs font-bold uppercase tracking-wide text-slate-600 mb-4">
    Stream
  </h4>

  <div className="space-y-2">
    {streams.map(stream => (
      <button
        key={stream}
        onClick={() => setSelectedStream(stream)}
        className={`
          w-full flex items-center justify-between
          px-4 py-2.5 rounded-xl border text-sm font-medium
          transition-all
          ${
            selectedStream === stream
              ? "bg-[#0A225A] text-white border-[#0A225A] shadow"
              : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
          }
        `}
      >
        {stream}
        {selectedStream === stream && <span></span>}
      </button>
    ))}
  </div>
</div>


      {/* DIVIDER */}
    <div className="h-px bg-slate-200" />


      {/* MODE */}
   <div>
  <h4 className="text-xs font-bold uppercase tracking-wide text-slate-600 mb-4">
    Mode
  </h4>

  <div className="space-y-2">
    {modes.map(mode => (
      <button
        key={mode}
        onClick={() => setSelectedMode(mode)}
        className={`
          w-full flex items-center justify-between
          px-4 py-2.5 rounded-xl border text-sm font-medium
          transition-all
          ${
            selectedMode === mode
              ? "bg-[#0A225A] text-white border-[#0A225A] shadow"
              : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
          }
        `}
      >
        {mode}
        {selectedMode === mode && <span></span>}
      </button>
    ))}
  </div>
</div>

      {/* DIVIDER */}
    <div className="h-px bg-slate-200" />

      {/* LEVEL */}
   <div>
  <h4 className="text-xs font-bold uppercase tracking-wide text-slate-600 mb-4">
    Level
  </h4>

  <div className="space-y-2">
    {levels.map(level => (
      <button
        key={level}
        onClick={() => setSelectedLevel(level)}
        className={`
          w-full flex items-center justify-between
          px-4 py-2.5 rounded-xl border text-sm font-medium
          transition-all
          ${
            selectedLevel === level
              ? "bg-[#0A225A] text-white border-[#0A225A] shadow"
              : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
          }
        `}
      >
        {level}
        {selectedLevel === level && <span></span>}
      </button>
    ))}
  </div>
</div>


      {/* CLEAR */}
     {(selectedStream !== "All" || selectedLevel !== "All" || selectedMode !== "All") && (
  <button
    onClick={clearFilters}
    className="
      w-full mt-6 py-2.5 rounded-xl
      text-sm font-semibold
      text-red-600 border border-red-200
      hover:bg-red-50 transition
    "
  >
    Reset Filters
  </button>
)}

    </div>
  </div>
</aside>




        {/* COURSES SECTIONS */}
        <div className="flex-1">
          {sectionViews.some((section) => section.courses.length > 0) ? (
            <div className="space-y-14">
              {sectionViews.map((section) => {
                if (section.courses.length === 0) {
                  return null;
                }

                return (
                  <section
                    key={section.key}
                    id={section.sectionId}
                    className="border-t border-slate-100 pt-8 first:border-t-0 first:pt-0"
                  >
                    {/* SEO-rich section header */}
                    <div className="mb-5 flex items-end justify-between gap-4">
                      <div>
                        {/* Gradient accent bar */}
                        <div className="h-1 w-10 rounded-full bg-gradient-to-r from-[#1f4fa8] to-[#f59e0b] mb-2" />
                        <h2 className="text-[18px] md:text-[22px] font-extrabold text-slate-800 leading-tight">
                          {section.title}
                        </h2>
                        {(section as any).seoDesc && (
                          <p className="text-[12px] text-slate-500 mt-1">{(section as any).seoDesc}</p>
                        )}
                      </div>
                      <span className="hidden text-[12px] font-semibold text-[#1f4fa8] hover:underline cursor-pointer md:inline whitespace-nowrap">
                        {section.linkLabel}
                      </span>
                    </div>

                    {/* Mobile: 2-col compact grid */}
                    <div className="grid grid-cols-2 gap-3 md:hidden">
                      {section.pagedCourses.map((course) => renderCompactCourseCard(course))}
                    </div>

                    {/* Desktop: grid or list */}
                    {section.desktopLayout === "grid" ? (
                      <div className="hidden md:grid md:grid-cols-2 xl:grid-cols-4 gap-5">
                        {section.pagedCourses.map((course) => renderCompactCourseCard(course))}
                      </div>
                    ) : (
                      <div className="hidden space-y-3 md:block">
                        {section.pagedCourses.map((course) => renderWideCourseCard(course))}
                      </div>
                    )}

                    {renderSectionPagination(section.key, section.currentPage, section.totalPages)}
                  </section>
                );
              })}
            </div>
          ) : (
            <div className="rounded-[24px] border border-[#d8d0c3] bg-[#ffffff] px-6 py-14 text-center shadow-sm">
              <p
                className="text-[1.7rem] text-[#0f203e]"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
              >
                No courses found
              </p>
              <p className="mt-3 text-sm text-slate-500">
                Try changing the search, stream, mode, or level filters.
              </p>
            </div>
          )}
        </div>

      </div>

      
   
   
    
{showMobileFilters && (
  <div className="fixed inset-0 z-50 bg-black/40 flex items-end md:hidden">
    <div className="w-full bg-white rounded-t-3xl max-h-[85vh] overflow-y-auto p-6 animate-slideUp">

      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold">Filters</h3>
        <button
          onClick={() => setShowMobileFilters(false)}
          className="text-red-600 font-semibold text-sm"
        >
          Close
        </button>
      </div>

      <div className="rounded-2xl border border-[#d8d1c5] bg-[#f6f3ec] shadow-sm overflow-hidden">
        <div className="flex items-center justify-between bg-[#081f39] px-4 py-3">
          <h3 className="text-white font-semibold text-[11px]">Filter Courses</h3>
          <button
            onClick={clearFilters}
            className="text-[#9bc3ff] text-[11px] font-medium"
          >
            Clear all
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="space-y-2">
            <p className="text-[12px] font-bold tracking-wide text-[#6d7f95] uppercase">
              Stream
            </p>
            <div className="max-h-40 overflow-y-auto space-y-2 pr-1">
              <label className="flex items-center gap-2 text-[15px] text-slate-800">
                <input
                  type="checkbox"
                  checked={selectedStream === "All"}
                  onChange={() => setSelectedStream("All")}
                  className="h-4 w-4 rounded border-slate-400"
                />
                <span className="flex-1">All Streams</span>
                <span className="text-slate-700">{searchMatchedCourses.length}</span>
              </label>

              {streams
                .filter((stream) => stream !== "All")
                .map((stream) => (
                  <label key={stream} className="flex items-center gap-2 text-[15px] text-slate-800">
                    <input
                      type="checkbox"
                      checked={selectedStream === stream}
                      onChange={() => setSelectedStream(selectedStream === stream ? "All" : stream)}
                      className="h-4 w-4 rounded border-slate-400"
                    />
                    <span className="flex-1">{stream}</span>
                    <span className="text-slate-700">
                      {
                        searchMatchedCourses.filter((course) =>
                          matchesFacetFilters(course, {
                            stream,
                            level: selectedLevel,
                            mode: selectedMode,
                          })
                        ).length
                      }
                    </span>
                  </label>
                ))}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-[12px] font-bold tracking-wide text-[#6d7f95] uppercase">
              Mode
            </p>
            <div className="max-h-36 overflow-y-auto space-y-2 pr-1">
              <label className="flex items-center gap-2 text-[15px] text-slate-800">
                <input
                  type="checkbox"
                  checked={selectedMode === "All"}
                  onChange={() => setSelectedMode("All")}
                  className="h-4 w-4 rounded border-slate-400"
                />
                <span className="flex-1">All Modes</span>
              </label>

              {modes
                .filter((mode) => mode !== "All")
                .map((mode) => (
                  <label key={mode} className="flex items-center gap-2 text-[15px] text-slate-800">
                    <input
                      type="checkbox"
                      checked={selectedMode === mode}
                      onChange={() => setSelectedMode(selectedMode === mode ? "All" : mode)}
                      className="h-4 w-4 rounded border-slate-400"
                    />
                    <span className="flex-1">{mode}</span>
                    <span className="text-slate-700">
                      {
                        searchMatchedCourses.filter((course) =>
                          matchesFacetFilters(course, {
                            stream: selectedStream,
                            level: selectedLevel,
                            mode,
                          })
                        ).length
                      }
                    </span>
                  </label>
                ))}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-[12px] font-bold tracking-wide text-[#6d7f95] uppercase">
              Level
            </p>
            <div className="max-h-36 overflow-y-auto space-y-2 pr-1">
              <label className="flex items-center gap-2 text-[15px] text-slate-800">
                <input
                  type="checkbox"
                  checked={selectedLevel === "All"}
                  onChange={() => setSelectedLevel("All")}
                  className="h-4 w-4 rounded border-slate-400"
                />
                <span className="flex-1">All Levels</span>
              </label>

              {levels
                .filter((level) => level !== "All")
                .map((level) => (
                  <label key={level} className="flex items-center gap-2 text-[15px] text-slate-800">
                    <input
                      type="checkbox"
                      checked={selectedLevel === level}
                      onChange={() => setSelectedLevel(selectedLevel === level ? "All" : level)}
                      className="h-4 w-4 rounded border-slate-400"
                    />
                    <span className="flex-1">{level}</span>
                    <span className="text-slate-700">
                      {
                        searchMatchedCourses.filter((course) =>
                          matchesFacetFilters(course, {
                            stream: selectedStream,
                            level,
                            mode: selectedMode,
                          })
                        ).length
                      }
                    </span>
                  </label>
                ))}
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={() => setShowMobileFilters(false)}
        className="w-full mt-6 bg-[#0A225A] text-white py-3 rounded-xl font-semibold"
      >
        Apply Filters
      </button>
    </div>
  </div>
)}

    </div> 
       <section className="mt-14 ">
        <div className="mx-auto max-w-[1120px] border-t border-[#d7d0c6] pt-10">
          <div className="overflow-hidden rounded-[30px] bg-[#1E4A7A] shadow-[0_20px_45px_rgba(7,29,53,0.12)]">
            <div className="grid gap-8 px-6 py-7 md:grid-cols-[1.35fr_0.75fr] md:px-10 md:py-9">
              <div className="max-w-[640px]">
                <p
                  className="text-[1.9rem] leading-tight text-white md:text-[2.35rem]"
                  style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
                >
                  StudyCups MBA Scholarship 2026
                </p>
                <p className="mt-3 max-w-[560px] text-sm leading-7 text-white/88 md:text-[1rem]">
                  StudyCups is offering a scholarship of up to INR 1 Lakh per
                  student for the MBA 2024-26 batch. This scholarship covers
                  tuition fees and books for deserving students who need
                  financial assistance.
                </p>
              </div>

              <div className="flex flex-col justify-between gap-5 md:items-end">
                <div className="text-left md:text-right">
                  <p
                    className="text-[2.5rem] leading-none text-[#f3a11c] md:text-[3.25rem]"
                    style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
                  >
                    INR 1 Lakh
                  </p>
                  <p className="mt-1 text-sm text-white/80">
                    Per Student - MBA Only
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm("MBA");
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="inline-flex min-h-[52px] items-center justify-center rounded-full bg-white px-6 text-sm font-bold text-[#0b5c73] transition hover:bg-[#f6f2ea] md:px-8"
                >
                  Apply for Scholarship <span className="ml-1">-&gt;</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-6 pt-6 md:pt-8 flex ">
        <div className="rounded-[28px] border border-[#ddd5c9] bg-[#f7f3ec] p-6 md:p-8">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <h2
              className="text-[1.9rem] leading-tight text-[#0f203e] md:text-[2.25rem]"
              style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
            >
              What Students Say
            </h2>

            <a
              href="tel:8081269969"
              className="text-sm font-semibold text-[#0f7a83] transition hover:text-[#0b5f68]"
            >
              Get your free counselling -&gt;
            </a>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            {COURSES_PAGE_TESTIMONIALS.map((item) => (
              <article
                key={`${item.name}-${item.meta}`}
                className="rounded-[22px] border border-[#ddd5c9] bg-white p-5 shadow-[0_10px_24px_rgba(15,35,63,0.05)]"
              >
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#f3a11c]">
                  5.0 / 5 Student Feedback
                </p>

                <p className="mt-3 text-sm italic leading-7 text-slate-600">
                  "{item.quote}"
                </p>

                <div className="mt-5 flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0f7a83] text-sm font-bold text-white">
                    {item.initial}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-[#10233e]">{item.name}</p>
                    <p className="text-xs text-[#0f7a83]">{item.meta}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

     <div className="flex hidden md:block container mx-auto px-6 pt-6 md:pt-8">
  <div className="overflow-hidden rounded-[28px] border border-[#183a57] bg-[linear-gradient(120deg,#041a31_0%,#072746_62%,#10273d_100%)] shadow-[0_28px_60px_rgba(4,20,38,0.18)]">
    <div className="grid lg:grid-cols-[1.65fr_0.85fr]">
      <div className="px-6 py-7 md:px-8 md:py-8 lg:px-8 lg:py-9">
        <div className="inline-flex rounded-full border border-[#f3a11c]/35 bg-[#f3a11c]/8 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-[#f3a11c]">
          Most Popular Course - 2026
        </div>

        <h2
          className="mt-5 max-w-[540px] text-[2rem] leading-[1.02] text-white md:text-[3rem]"
          style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
        >
         {" "}
          <span className="font-medium italic text-[#f3a11c]">Admission</span>
          <br />
          Consulting
        </h2>

        <p className="mt-4 max-w-[560px] text-sm leading-7 text-white/75 md:text-[0.98rem]">
          Whether you scored 95 in CAT or 55, we help you shortlist the right MBA
          college, refine your SOP, and manage the admission process end to end.
        </p>

        <div className="mt-5 flex flex-wrap gap-2.5 text-xs font-semibold">
          <span className="rounded-full border border-cyan-400/25 bg-cyan-400/10 px-3 py-1.5 text-cyan-200">
            CAT - XAT - MAT - CMAT
          </span>
          <span className="rounded-full border border-[#f3a11c]/25 bg-[#f3a11c]/10 px-3 py-1.5 text-[#f8bf63]">
            Low Score Specialist
          </span>
          <span className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1.5 text-emerald-300">
            INR 1 Lakh Scholarship Available
          </span>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            onClick={() => {
              setSearchTerm("MBA");
              setSelectedStream("Management");
              setSelectedLevel("All");
              setSelectedMode("All");
            }}
            className="rounded-full bg-[#f3a11c] px-6 py-3 text-sm font-bold text-[#071d35] shadow-[0_10px_28px_rgba(243,161,28,0.28)] transition hover:brightness-105"
          >
            Get Free MBA Guidance
          </button>

          <button
            onClick={() => {
              setSearchTerm("MBA");
            }}
            className="rounded-full border border-white/18 bg-white/[0.03] px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
          >
            Explore MBA
          </button>
        </div>
      </div>

      <div className="border-t border-white/10 bg-white/[0.04] px-6 py-7 md:px-8 md:py-8 lg:border-l lg:border-t-0">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-white/45">
          What's Included
        </p>

        <div className="mt-5 space-y-4">
          {[
            ["PA", "Profile Assessment", "Free call to understand your goals, score and budget"],
            ["CS", "College Shortlist", "10-15 colleges curated for your exact profile in 24 hours"],
            ["SOP", "SOP and Essay Writing", "Expert-crafted documents that help your application stand out"],
            ["PI", "Mock PI and GD Prep", "Realistic interview coaching until you feel fully prepared"],
          ].map(([tag, title, text]) => (
            <div key={title} className="flex gap-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[#f3a11c]/18 bg-[#f3a11c]/10 text-[11px] font-bold text-[#f3a11c]">
                {tag}
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{title}</p>
                <p className="text-xs leading-5 text-white/60">{text}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
          <p className="text-center text-xs leading-5 text-white/55">
            Speak to an MBA counsellor today. The first consultation is free.
          </p>
          <a
            href="tel:8081269969"
            className="mt-4 flex items-center justify-center rounded-xl bg-[#17889a] px-4 py-3 text-sm font-bold text-white transition hover:brightness-105"
          >
            Call 8081269969
          </a>
        </div>
      </div>
    </div>
  </div>

  <div className="mt-8 h-px bg-[#d7d0c6]" />
</div>

{/* ── SEO TEXT BLOCK + AI-Friendly Content ── */}
<section className="max-w-7xl mx-auto px-4 md:px-8 py-10">

  {/* Gradient divider heading */}
  <div className="flex items-center gap-3 mb-6">
    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
    <span className="text-xs font-bold uppercase tracking-widest text-slate-400">About These Programs</span>
    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
  </div>

  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

    {/* SEO text block */}
    <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-[0_4px_20px_rgba(10,33,74,0.06)]">
      <h2 className="text-base font-bold text-slate-800 mb-3">
        {selectedStream && selectedStream !== "All"
          ? `Best ${selectedStream} Courses in India 2026 — Fees, Syllabus & Colleges`
          : "Top Courses in India 2026 — MBA, B.Tech, MBBS, Law, BCA & More"}
      </h2>
      <p className="text-sm text-slate-600 leading-relaxed mb-3">
        StudyCups lists <strong>{filteredCourses.length}+</strong>{" "}
        {selectedStream && selectedStream !== "All" ? selectedStream : ""} courses offered
        by top-ranked colleges across India. Compare programs by fees, duration, eligibility
        criteria, entrance exams (JEE, NEET, CAT, CLAT, CUET), career scope, and average
        salary packages — all updated for 2026 admissions.
      </p>
      <p className="text-sm text-slate-600 leading-relaxed">
        Popular programs:&nbsp;
        {["MBA", "B.Tech", "MBBS", "BCA", "BBA", "LLB", "B.Com", "M.Tech", "PGDM"].map((c, i, arr) => (
          <span key={c}>
            <button
              type="button"
              onClick={() => setSelectedStream(c === "MBA" || c === "PGDM" ? "Management" : c === "B.Tech" || c === "M.Tech" ? "Engineering" : c === "MBBS" ? "Medical" : c === "LLB" ? "Law" : "All")}
              className="text-blue-600 hover:underline font-medium"
            >{c}</button>
            {i < arr.length - 1 && " · "}
          </span>
        ))}.
      </p>
    </div>

    {/* AI-friendly quick answers */}
    <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-[0_4px_20px_rgba(10,33,74,0.06)]">
      <h2 className="text-base font-bold text-slate-800 mb-4">
        Frequently Asked — Course Admissions 2026
      </h2>
      <div className="space-y-3">
        {[
          {
            q: "Which is the best MBA college in India 2026?",
            a: "IIMs, XLRI, MDI, SPJIMR and FMS Delhi rank among the top MBA colleges. StudyCups helps you shortlist based on your CAT/GMAT score and budget.",
          },
          {
            q: "What is the eligibility for B.Tech admissions?",
            a: "B.Tech requires 10+2 with Physics, Chemistry & Maths (PCM) and a valid JEE Main / state entrance exam score.",
          },
          {
            q: "Can I get admission in MBBS without NEET?",
            a: "No. NEET-UG is mandatory for all MBBS admissions in India as per the Supreme Court order.",
          },
          {
            q: "What courses can I do after 12th Commerce?",
            a: "After 12th Commerce you can pursue BBA, B.Com, BCA, Integrated MBA, CA Foundation, or Law (LLB 5-year).",
          },
        ].map(({ q, a }) => (
          <details key={q} className="group">
            <summary className="flex items-start gap-2 cursor-pointer text-sm font-semibold text-slate-700 list-none">
              <span className="text-[#1f4fa8] mt-0.5 flex-shrink-0">Q.</span>
              <span>{q}</span>
            </summary>
            <p className="mt-1.5 ml-5 text-xs text-slate-500 leading-relaxed">{a}</p>
          </details>
        ))}
      </div>
    </div>
  </div>

  {/* Popular streams gradient chips */}
  <div className="mt-6 flex flex-wrap gap-2 items-center">
    <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Browse by Stream:</span>
    {[
      { label: "MBA / PGDM", stream: "Management", color: "from-blue-500 to-indigo-600" },
      { label: "B.Tech / M.Tech", stream: "Engineering", color: "from-indigo-500 to-violet-600" },
      { label: "MBBS / Medical", stream: "Medical", color: "from-red-500 to-rose-600" },
      { label: "Law / LLB", stream: "Law", color: "from-emerald-500 to-teal-600" },
      { label: "BBA / BCA", stream: "Commerce", color: "from-amber-500 to-orange-600" },
      { label: "Design", stream: "Design", color: "from-pink-500 to-fuchsia-600" },
    ].map(({ label, stream, color }) => (
      <button
        key={stream}
        type="button"
        onClick={() => setSelectedStream(stream)}
        className={`inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r ${color} px-4 py-1.5 text-[11px] font-semibold text-white shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all`}
      >
        {label}
      </button>
    ))}
  </div>
</section>

    </div>
  );
};

export default CoursesPage;
