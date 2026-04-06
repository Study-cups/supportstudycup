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
  onOpenApplyNow?: () => void;
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

type FacetCountMap = Record<string, number>;

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
    title: "Postgraduate Programs",
    linkLabel: "View all PG courses ->",
    sectionId: "courses-postgraduate",
    desktopLayout: "grid" as const,
  },
  {
    key: "undergraduate" as CourseSectionKey,
    title: "Undergraduate Programs",
    linkLabel: "View all UG courses ->",
    sectionId: "courses-undergraduate",
    desktopLayout: "list" as const,
  },
  {
    key: "popular" as CourseSectionKey,
    title: "Popular Programs",
    linkLabel: "View all popular courses ->",
    sectionId: "courses-popular",
    desktopLayout: "list" as const,
  },
];

const createSectionPageState = (): Record<CourseSectionKey, number> => ({
  postgraduate: 1,
  undergraduate: 1,
  popular: 1,
});

const createMobileSectionExpansionState = (): Record<CourseSectionKey, boolean> => ({
  postgraduate: false,
  undergraduate: false,
  popular: false,
});

const MOBILE_SECTION_PREVIEW_COUNT = 3;

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
  onOpenApplyNow,
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
  const [sectionPages, setSectionPages] = useState<Record<CourseSectionKey, number>>(
    createSectionPageState
  );
  const [expandedMobileSections, setExpandedMobileSections] =
    useState<Record<CourseSectionKey, boolean>>(createMobileSectionExpansionState);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const desktopFacetRef = useRef<HTMLDivElement | null>(null);




const location = useLocation();

useEffect(() => {
  setSectionPages(createSectionPageState());
  setExpandedMobileSections(createMobileSectionExpansionState());
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

const incrementFacetCounts = (counts: FacetCountMap, values: string[]) => {
  Array.from(new Set(values.filter(Boolean))).forEach((value) => {
    counts[value] = (counts[value] || 0) + 1;
  });
};

const getCategorySlugFromStream = (courseName: string) => {
  return deriveStream(courseName)
    .toLowerCase()
    .replace(/\s+/g, "-");
};
function formatToLakhs(num:any) {
  if (!num) return "N/A";

  let lakhs = num / 100000;

  // keep 2 decimals max (20.75)
  lakhs = Math.round(lakhs * 100) / 100;

  return "Ã¢â€šÂ¹" + lakhs + " Lakhs";
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
  const searchText = normalizeText(
    [
      name,
      getPrimaryFacetValue(filterLevels),
      getPrimaryFacetValue(modeValues),
      getPrimaryFacetValue(filterStreams, derivedStream),
      ...matchableStreams,
      ...filterLevels,
      ...modeValues,
      "phd",
      "doctoral",
      name.includes("Working") ? "working professional part time wp" : "",
      name.includes("Executive") ? "executive management" : "",
    ].join(" ")
  );

  return {
    ...course,
    courseKey: slug || name,
    derivedStream,
    slug,
    name,
    searchText,
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
      console.error("Courses API error", err);
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

const searchMatchedCourses = useMemo(() => {
  return courses.filter((course) => {
    const searchable = course.searchText || "";

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
    course.derivedStream === filters.stream;

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

const streamCounts = useMemo(() => {
  const counts: FacetCountMap = {};

  searchMatchedCourses.forEach((course) => {
    if (
      !matchesFacetFilters(course, {
        stream: "All",
        level: selectedLevel,
        mode: selectedMode,
      })
    ) {
      return;
    }

    incrementFacetCounts(
      counts,
      course.streams?.length ? course.streams : [course.stream || course.derivedStream]
    );
  });

  return counts;
}, [searchMatchedCourses, selectedLevel, selectedMode]);

const modeCounts = useMemo(() => {
  const counts: FacetCountMap = {};

  searchMatchedCourses.forEach((course) => {
    if (
      !matchesFacetFilters(course, {
        stream: selectedStream,
        level: selectedLevel,
        mode: "All",
      })
    ) {
      return;
    }

    incrementFacetCounts(counts, course.modes || []);
  });

  return counts;
}, [searchMatchedCourses, selectedStream, selectedLevel]);

const levelCounts = useMemo(() => {
  const counts: FacetCountMap = {};

  searchMatchedCourses.forEach((course) => {
    if (
      !matchesFacetFilters(course, {
        stream: selectedStream,
        level: "All",
        mode: selectedMode,
      })
    ) {
      return;
    }

    incrementFacetCounts(counts, course.levels || []);
  });

  return counts;
}, [searchMatchedCourses, selectedStream, selectedMode]);


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
  const countMap =
    type === "stream" ? streamCounts : type === "level" ? levelCounts : modeCounts;

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
      count: countMap[value] || 0,
    }))
    .filter(chip => chip.count > 0);
};

const streamFilterChips = useMemo(
  () => buildFilterChips(streams, "stream"),
  [streams, selectedStream, selectedLevel, selectedMode, streamCounts]
);

const levelFilterChips = useMemo(
  () => buildFilterChips(levels, "level"),
  [levels, selectedStream, selectedLevel, selectedMode, levelCounts]
);

const modeFilterChips = useMemo(
  () => buildFilterChips(modes, "mode"),
  [modes, selectedStream, selectedLevel, selectedMode, modeCounts]
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

const professionalModeOption = useMemo(
  () =>
    modes.find((mode) =>
      /(professional|executive|working|part[\s-]?time|weekend)/i.test(mode)
    ) || null,
  [modes]
);

const isHeroAllCoursesActive =
  selectedStream === "All" && selectedLevel === "All" && selectedMode === "All";

const isHeroProfessionalActive = professionalModeOption
  ? selectedMode === professionalModeOption
  : false;

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

const renderCompactCourseCard = (course: any) => {
  const courseLink = getCourseLink(course);
  const courseTags = getCourseCardTags(course);

  return (
    <div
      key={course.courseKey}
      onClick={() => navigate(courseLink)}
      className="group flex h-full cursor-pointer flex-col overflow-hidden rounded-[24px] border border-[#d6cec2] bg-[#ffffff] shadow-[0_10px_22px_rgba(15,35,63,0.06)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_34px_rgba(15,35,63,0.12)]"
    >
      <div className="p-4 md:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#efe8da] text-[#0a5474]">
            <GraduationCap className="h-5 w-5 md:h-6 md:w-6" strokeWidth={2} />
          </div>

          <span className="rounded-full border border-[#f3a11c]/20 bg-[#f7ebd2] px-3 py-1 text-[10px] font-semibold text-[#cb7b12] md:text-[11px]">
            {getCourseBadgeLabel(course)}
          </span>
        </div>

        <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#0b6b86]">
          {course.stream || "General Program"}
        </p>

        <h3
          className="mt-2 line-clamp-2 text-[1.42rem] leading-[1.05] text-[#0f203e] md:text-[1.05rem] lg:text-[1rem]"
          style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
        >
          {course.name}
        </h3>

        <p className="mt-3 line-clamp-3 min-h-[4.5rem] text-[13px] leading-6 text-slate-500 md:min-h-[5.4rem] md:text-[12px] md:leading-6">
          {getCourseCardDescription(course)}
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {courseTags.map((tag) => (
            <span
              key={`${course.courseKey}-${tag}`}
              className="rounded-full border border-[#d8cdbd] bg-[#f7f1e6] px-2.5 py-1 text-[10px] font-medium text-[#0f2d52] md:text-[11px]"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-auto grid grid-cols-3 border-y border-[#d8cdbd] bg-[#f7f2e9]">
        <div className="px-3 py-3 text-center">
          <p
            className="text-[1rem] font-semibold leading-tight text-[#0f203e] md:text-[0.9rem]"
            style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
          >
            {course.totalColleges || 0}+
          </p>
          <p className="mt-1 text-[10px] uppercase tracking-[0.08em] text-slate-500">
            Colleges
          </p>
        </div>

        <div className="border-x border-[#d8cdbd] px-3 py-3 text-center">
          <p
            className="truncate text-[0.94rem] font-semibold leading-tight text-[#0f203e] md:text-[0.7rem]"
            style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
          >
            {course.duration && course.duration !== "N/A" ? course.duration : "NA"}
          </p>
          <p className="mt-1 text-[10px] uppercase tracking-[0.08em] text-slate-500">
            Duration
          </p>
        </div>

        <div className="px-3 py-3 text-center">
          <p
            className="truncate text-[0.94rem] font-semibold leading-tight text-[#0f203e] md:text-[0.9rem]"
            style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
          >
            {course.level || "N/A"}
          </p>
          <p className="mt-1 text-[10px] uppercase tracking-[0.08em] text-slate-500">
            Level
          </p>
        </div>
      </div>

      <div className="grid grid-cols-[1fr_auto] gap-3 p-4">
        <button
          onClick={(event) => {
            event.stopPropagation();
            navigate(courseLink);
          }}
          className="rounded-xl bg-[#eb980f] px-4 py-3 text-[13px] font-bold text-[#0f203e] transition hover:brightness-105 md:px-4 md:text-sm"
        >
          Enquire Free
        </button>

        <button
          onClick={(event) => {
            event.stopPropagation();
            navigate(courseLink);
          }}
          aria-label={`Open ${course.name}`}
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#d6cec2] bg-white text-[#0f2d52] transition hover:bg-[#f5efe5]"
        >
          <ArrowRight className="h-4 w-4" strokeWidth={2.2} />
        </button>
      </div>
    </div>
  );
};

const renderWideCourseCard = (course: any) => {
  const courseLink = getCourseLink(course);
  const courseHighlights = getWideCourseHighlights(course);
  const accentTones = [
    {
      iconBox: "border-[#d5dde5] bg-[#eaf1f4] text-[#205a77]",
      badge: "bg-[#e8edff] text-[#3954c7]",
    },
    {
      iconBox: "border-[#eadac6] bg-[#f7ecdc] text-[#bd7e22]",
      badge: "bg-[#dff3e6] text-[#13834f]",
    },
    {
      iconBox: "border-[#ead5d8] bg-[#f7e8eb] text-[#ad4c66]",
      badge: "bg-[#fde5eb] text-[#c2456a]",
    },
  ];
  const accentTone = accentTones[hashIndex(course.courseKey || course.name) % accentTones.length];

  return (
    <div
      key={course.courseKey}
      onClick={() => navigate(courseLink)}
      className="group flex cursor-pointer items-start justify-between gap-6 rounded-[20px] border border-[#d7cfc3] bg-[#ffffff] px-5 py-5 shadow-[0_10px_24px_rgba(15,35,63,0.05)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_30px_rgba(15,35,63,0.09)]"
    >
      <div className="flex min-w-0 flex-1 gap-4">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${accentTone.iconBox}`}
        >
          <GraduationCap className="h-5 w-5" strokeWidth={2.1} />
        </div>

        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#0b6b86]">
            {course.stream || "General Program"}
          </p>

          <h3
            className="mt-1 line-clamp-2 text-[1.65rem] leading-[1.02] text-[#0f203e]"
            style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
          >
            {course.name}
          </h3>

          <p className="mt-2 max-w-[720px] text-sm leading-7 text-slate-500">
            {getCourseCardDescription(course)}
          </p>

          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
            {courseHighlights.map((item) => (
              <span
                key={`${course.courseKey}-${item}`}
                className="flex items-center gap-2 text-[12px] font-semibold text-[#0f2d52]"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-[#0b6b86]" />
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-6">
        <span className={`rounded-full px-3 py-1 text-[11px] font-semibold ${accentTone.badge}`}>
          {getWideCourseBadgeLabel(course)}
        </span>

        <button
          onClick={(event) => {
            event.stopPropagation();
            navigate(courseLink);
          }}
          className="rounded-xl bg-[#eb980f] px-5 py-3 text-sm font-bold text-[#0f203e] transition hover:brightness-105"
        >
          Enquire Free <span aria-hidden="true">-&gt;</span>
        </button>
      </div>
    </div>
  );
};

const renderSectionPagination = (
  sectionKey: CourseSectionKey,
  currentPage: number,
  totalPages: number
) => {
  if (isMobileViewport || totalPages <= 1) {
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

const toggleMobileSectionExpansion = (sectionKey: CourseSectionKey) => {
  setExpandedMobileSections((previous) => ({
    ...previous,
    [sectionKey]: !previous[sectionKey],
  }));
};

const renderCompactCourseCardSkeleton = (key: string) => (
  <div
    key={key}
    className="flex h-full flex-col overflow-hidden rounded-[24px] border border-[#d6cec2] bg-white shadow-[0_10px_22px_rgba(15,35,63,0.06)] animate-pulse"
  >
    <div className="p-4 md:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="h-12 w-12 rounded-2xl bg-slate-200" />
        <div className="h-7 w-28 rounded-full bg-slate-200" />
      </div>

      <div className="mt-4 h-3 w-24 rounded-full bg-slate-200" />
      <div className="mt-3 h-8 w-4/5 rounded-xl bg-slate-200" />

      <div className="mt-4 space-y-2">
        <div className="h-3 rounded-full bg-slate-200" />
        <div className="h-3 w-11/12 rounded-full bg-slate-200" />
        <div className="h-3 w-3/4 rounded-full bg-slate-200" />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {[...Array(3)].map((_, index) => (
          <div
            key={`${key}-tag-${index}`}
            className="h-6 w-20 rounded-full bg-slate-200"
          />
        ))}
      </div>
    </div>

    <div className="mt-auto grid grid-cols-3 border-y border-[#d8cdbd] bg-[#f7f2e9]">
      {[...Array(3)].map((_, index) => (
        <div
          key={`${key}-meta-${index}`}
          className={`px-3 py-3 text-center ${index === 1 ? "border-x border-[#d8cdbd]" : ""}`}
        >
          <div className="mx-auto h-4 w-12 rounded-full bg-slate-200" />
          <div className="mx-auto mt-2 h-2 w-14 rounded-full bg-slate-200" />
        </div>
      ))}
    </div>

    <div className="grid grid-cols-[1fr_auto] gap-3 p-4">
      <div className="h-11 rounded-xl bg-slate-200" />
      <div className="h-11 w-11 rounded-xl bg-slate-200" />
    </div>
  </div>
);

const renderWideCourseCardSkeleton = (key: string) => (
  <div
    key={key}
    className="flex items-start justify-between gap-6 rounded-[20px] border border-[#d7cfc3] bg-white px-5 py-5 shadow-[0_10px_24px_rgba(15,35,63,0.05)] animate-pulse"
  >
    <div className="flex min-w-0 flex-1 gap-4">
      <div className="h-12 w-12 shrink-0 rounded-2xl bg-slate-200" />

      <div className="min-w-0 flex-1">
        <div className="h-3 w-24 rounded-full bg-slate-200" />
        <div className="mt-3 h-8 w-2/3 rounded-xl bg-slate-200" />

        <div className="mt-4 space-y-2">
          <div className="h-3 rounded-full bg-slate-200" />
          <div className="h-3 w-11/12 rounded-full bg-slate-200" />
          <div className="h-3 w-4/5 rounded-full bg-slate-200" />
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          {[...Array(4)].map((_, index) => (
            <div
              key={`${key}-highlight-${index}`}
              className="h-3 w-20 rounded-full bg-slate-200"
            />
          ))}
        </div>
      </div>
    </div>

    <div className="hidden shrink-0 flex-col items-end gap-6 md:flex">
      <div className="h-7 w-24 rounded-full bg-slate-200" />
      <div className="h-11 w-32 rounded-xl bg-slate-200" />
    </div>
  </div>
);

const renderCoursesLoadingState = () => (
  <div className="space-y-14">
    {COURSE_SECTION_CONFIG.map((section) => (
      <section
        key={section.key}
        className="border-t border-[#d8d0c3] pt-10 first:border-t-0 first:pt-0"
      >
        <div className="mb-6 flex flex-col items-start gap-3 md:flex-row md:items-center md:justify-between">
          <div className="h-10 w-56 rounded-full bg-slate-200 animate-pulse" />
          <div className="hidden h-4 w-32 rounded-full bg-slate-200 animate-pulse md:block" />
        </div>

        <div className="flex gap-4 overflow-hidden px-2 pb-3 md:hidden">
          {[...Array(3)].map((_, index) => (
            <div
              key={`${section.key}-mobile-${index}`}
              className="min-w-[240px] max-w-[260px] shrink-0"
            >
              {renderCompactCourseCardSkeleton(`${section.key}-mobile-card-${index}`)}
            </div>
          ))}
        </div>

        {section.desktopLayout === "grid" ? (
          <div className="hidden md:grid md:grid-cols-2 xl:grid-cols-4 md:gap-8">
            {[...Array(4)].map((_, index) =>
              renderCompactCourseCardSkeleton(`${section.key}-grid-${index}`)
            )}
          </div>
        ) : (
          <div className="hidden space-y-4 md:block">
            {[...Array(3)].map((_, index) =>
              renderWideCourseCardSkeleton(`${section.key}-row-${index}`)
            )}
          </div>
        )}
      </section>
    ))}
  </div>
);

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f5f7fb] md:overflow-visible">
       <Helmet>
              <title>
                StudyCups  Compare Colleges, Courses & Exams in India
              </title>
              <meta
                name="description"
                content="StudyCups helps students compare colleges, courses, fees, placements and exams across India. Find your dream college today."
              />
              <link rel="canonical" href="https://studycups.in/" />
            </Helmet>

{/* HERO */}
<section className="relative mt-0 md:mt-20 overflow-hidden bg-[#071d35]">
  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(245,158,11,0.08),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(37,99,235,0.22),_transparent_32%)]" />
  <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(3,17,33,0.96)_0%,rgba(6,29,55,0.94)_55%,rgba(0,62,109,0.88)_100%)]" />
  <div className="absolute -left-16 top-24 h-36 w-36 rounded-full bg-[#f59e0b]/10 blur-3xl md:h-56 md:w-56" />
  <div className="absolute right-0 top-20 h-48 w-48 rounded-full bg-cyan-400/10 blur-3xl md:h-72 md:w-72" />

  <div className="relative container mx-auto px-4 py-5 md:px-6 md:py-4">
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div className="max-w-[690px]">
        <div className="flex flex-wrap items-center gap-2 pt-2 text-xs text-white/70 md:pt-3 md:text-sm md:text-white/60">
          <span onClick={() => navigate("/")} className="cursor-pointer">
            Home
          </span>
          <span className="text-white/30">&gt;</span>
          <span className="font-semibold text-[#f3a11c]">Courses &amp; Programs</span>
        </div>

        <div className="mt-8 inline-flex rounded-full border border-[#f3a11c]/45 bg-[#f3a11c]/10 px-4 py-2 text-[0.65rem] font-bold uppercase tracking-[0.08em] text-[#f3a11c] md:hidden">
          All Programs - 2026 Admissions Open
        </div>
      

        <h1
          className="mt-4 max-w-[640px] pt-1 text-[30px] leading-[1.2] text-white md:mt-3 md:pt-3 md:text-[3rem] md:leading-[0.96]"
          style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
        >
          Find the{" "}
          <span className="font-medium italic text-[#f3a11c]">Right Course</span>
          <br />
          for Your Career
        </h1>

        <p className="max-w-[590px] pt-5 text-[15px] leading-[1.72] text-white/82 md:pt-8 md:text-[0.94rem] md:leading-6">
          From MBA to MBBS, B.Tech to Fashion Design, our expert counsellors help
          you get admitted to the best college for your goals, budget, and score.
          Free guidance for every course.
        </p>

        <div className="mt-8 hidden max-w-[500px] md:block">
          <label className="relative block">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-base text-white/45">
              Search
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search B.Tech, MBA, MBBS, Design..."
              className="h-10 w-full rounded-full border border-white/14 bg-white/8 pl-20 pr-5 text-sm text-white placeholder:text-white/35 outline-none transition focus:border-[#f3a11c]/60 focus:bg-white/12"
            />
          </label>
        </div>

        <div className="mt-7 flex flex-wrap gap-2 md:hidden">
          <button
            type="button"
            onClick={() => {
              clearFilters();
            }}
            className={`rounded-full border px-3 py-2 text-[10px] font-semibold leading-none transition ${
              isHeroAllCoursesActive
                ? "border-[#f3a11c] bg-[#f3a11c] text-[#111827]"
                : "border-white/18 bg-white/8 text-white/85"
            }`}
          >
            All Courses
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedLevel(selectedLevel === "Postgraduate" ? "All" : "Postgraduate");
              setSelectedMode("All");
            }}
            className={`rounded-full border px-3 py-2 text-[10px] font-semibold leading-none transition ${
              selectedLevel === "Postgraduate"
                ? "border-[#f3a11c] bg-[#f3a11c] text-[#111827]"
                : "border-white/18 bg-white/8 text-white/85"
            }`}
          >
            Postgraduate
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedLevel(selectedLevel === "Undergraduate" ? "All" : "Undergraduate");
              setSelectedMode("All");
            }}
            className={`rounded-full border px-3 py-2 text-[10px] font-semibold leading-none transition ${
              selectedLevel === "Undergraduate"
                ? "border-[#f3a11c] bg-[#f3a11c] text-[#111827]"
                : "border-white/18 bg-white/8 text-white/85"
            }`}
          >
            Undergraduate
          </button>

          <button
            type="button"
            onClick={() => {
              if (!professionalModeOption) return;
              setSelectedMode(
                selectedMode === professionalModeOption ? "All" : professionalModeOption
              );
              setSelectedLevel("All");
            }}
            className={`rounded-full border px-3 py-2 text-[10px] font-semibold leading-none transition ${
              isHeroProfessionalActive
                ? "border-[#f3a11c] bg-[#f3a11c] text-[#111827]"
                : "border-white/18 bg-white/8 text-white/85"
            }`}
          >
            Professional
          </button>
        </div>

      </div>

      <div className="hidden w-full max-w-[228px] shrink-0 md:block lg:mr-2">
        <div className="rounded-[22px] border border-white/10 bg-white/[0.08] p-4 shadow-[0_18px_42px_rgba(0,0,0,0.22)] backdrop-blur-xl">
          <p
            className="text-center text-[2.75rem] leading-none text-[#f3a11c]"
            style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
          >
            {loading ? "6" : Math.max(streams.length - 1, 6)}
          </p>
          <p className="mt-1 text-center text-[0.88rem] text-white/78">
            Programs We Specialise In
          </p>

          <div className="mt-4 h-px bg-white/10" />

          <div className="mt-4 space-y-2 text-[0.88rem] text-white/72">
            <div className="flex items-center justify-between gap-4">
              <span>Partner Colleges</span>
              <span className="font-semibold text-[#f3a11c]">500+</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span>Students Guided</span>
              <span className="font-semibold text-[#f3a11c]">5,000+</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span>Justdial Rating</span>
              <span className="font-semibold text-[#f3a11c]">4.6/5</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span>Scholarship Available</span>
              <span className="font-semibold text-[#f3a11c]">INR 1 Lakh</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<div className="hidden lg:block sticky top-[74px] z-40  bg-[#f5f7fb] border-b border-[#d9d4ca] shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
  <div className="w-full px-0 py-0">
    <div className="border-0 bg-[#f6f1e8] px-6 py-3">
      <div ref={desktopFacetRef} className="flex flex-col gap-3">
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
</div>

{/* ONLY MOBILE SEARCH + FILTER */}
<div className="md:hidden max-w-7xl mx-auto px-4 mt-3 mb-4">
  <div className="bg-white rounded-xl border-none shadow-none flex items-center gap-3 px-4 py-3">
    <input
      placeholder="Search course, stream, mode..."
      className="
        flex-1 text-sm
        bg-transparent
        border-0
        outline-none
        ring-0
        focus:ring-0
        focus:outline-none
        shadow-none
      "
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
    />
    <button
      onClick={() => setShowMobileFilters(true)}
      className="text-sm font-semibold text-[var(--primary-medium)]"
    >
      Filters
    </button>
  </div>
</div>





      <div className="container mx-auto px-6 py-12"> 
       <div className="flex items-start gap-8">
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
        <div className="min-w-0 flex-1">
          {loading ? (
            renderCoursesLoadingState()
          ) : sectionViews.some((section) => section.courses.length > 0) ? (
            <div className="space-y-14">
              {sectionViews.map((section) => {
                if (section.courses.length === 0) {
                  return null;
                }

                const mobilePreviewCourses = section.courses.slice(0, MOBILE_SECTION_PREVIEW_COUNT);
                const isMobileSectionExpanded = expandedMobileSections[section.key];
                const hasExpandableMobileView =
                  section.courses.length > MOBILE_SECTION_PREVIEW_COUNT;

                return (
                  <section
                    key={section.key}
                    id={section.sectionId}
                    className="border-t border-[#d8d0c3] pt-10 first:border-t-0 first:pt-0"
                  >
                    <div className="mb-6 flex flex-col items-start gap-2 md:flex-row md:items-center md:justify-between md:gap-4">
                      <h2
                        className="text-[1.9rem] leading-tight text-[#0f203e] md:text-[2.2rem]"
                        style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
                      >
                        {section.title}
                      </h2>

                      {hasExpandableMobileView ? (
                        <button
                          type="button"
                          onClick={() => toggleMobileSectionExpansion(section.key)}
                          aria-expanded={isMobileSectionExpanded}
                          className="text-sm font-semibold text-[#0b6b86] md:hidden"
                        >
                          {isMobileSectionExpanded ? "Show fewer ->" : section.linkLabel}
                        </button>
                      ) : (
                        <span className="text-sm font-medium text-[#0b6b86] md:hidden">
                          {section.courses.length} course{section.courses.length === 1 ? "" : "s"}
                        </span>
                      )}

                      <span className="hidden text-sm font-medium text-[#0b6b86] md:inline">
                        {section.linkLabel}
                      </span>
                    </div>

                    <div className="md:hidden">
                      {isMobileSectionExpanded ? (
                        <div className="space-y-4">
                          {section.courses.map((course:any) => (
                            <div key={course.courseKey}>{renderCompactCourseCard(course)}</div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth snap-x snap-mandatory px-2 pb-3">
                          {mobilePreviewCourses.map((course:any) => (
                            <div
                              key={course.courseKey}
                              className="min-w-[240px] max-w-[260px] shrink-0 snap-start"
                            >
                              {renderCompactCourseCard(course)}
                            </div>
                          ))}
                        </div>
                      )}

                      {hasExpandableMobileView && !isMobileSectionExpanded ? (
                        <p className="mt-3 px-1 text-[11px] font-medium uppercase tracking-[0.08em] text-slate-500">
                          Showing 3 of {section.courses.length} courses
                        </p>
                      ) : null}
                    </div>

                    {section.desktopLayout === "grid" ? (
                      <div className="hidden md:grid md:grid-cols-2 xl:grid-cols-4 md:gap-8">
                        {section.pagedCourses.map((course:any) => renderCompactCourseCard(course))}
                      </div>
                    ) : (
                      <div className="hidden space-y-4 md:block">
                        {section.pagedCourses.map((course:any) => renderWideCourseCard(course))}
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
                    <span className="text-slate-700">{streamCounts[stream] || 0}</span>
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
                    <span className="text-slate-700">{modeCounts[mode] || 0}</span>
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
                    <span className="text-slate-700">{levelCounts[level] || 0}</span>
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
                     onClick={onOpenApplyNow}
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
              onOpenApplyNow?.();
             
            }}
            className="rounded-full bg-[#f3a11c] px-6 py-3 text-sm font-bold text-[#071d35] shadow-[0_10px_28px_rgba(243,161,28,0.28)] transition hover:brightness-105"
          >
            Get Free  Guidance
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

    </div>
  );
};

export default CoursesPage;
