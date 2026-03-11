import React, { useEffect, useMemo, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import FlexibleBlockRenderer from "./FlexibleBlockRenderer";
import { buildCourseDetailPath } from "./Seo";

interface CourseDetailPageProps {
  onOpenApplyNow: () => void;
  onOpenBrochure: () => void;
}

type CourseTab = "Overview" | "Syllabus" | "Top Colleges";

const TAB_KEY_TO_SLUG: Record<CourseTab, string> = {
  Overview: "overview",
  Syllabus: "syllabus",
  "Top Colleges": "collegeoffering",
};

const TAB_SLUG_TO_KEY: Record<string, CourseTab> = {
  overview: "Overview",
  syllabus: "Syllabus",
  collegeoffering: "Top Colleges",
  collegesoffering: "Top Colleges",
  topcolleges: "Top Colleges",
};

const API_BASE = "https://studycupsbackend-wb8p.onrender.com/api";
const DESKTOP_SIDEBAR_STICKY_TOP = 140;
const DESKTOP_SIDEBAR_BOTTOM_GAP = 24;

const CTA_TEXTS = new Set([
  "apply now",
  "check eligibility",
  "get updates",
]);

const getTextValue = (value: unknown): string => {
  if (typeof value === "string") return value.trim();
  if (value && typeof value === "object" && "value" in value) {
    return String((value as { value?: unknown }).value ?? "").trim();
  }
  return "";
};

const replaceBrand = (text = "") => text.replace(/collegedunia/gi, "StudyCups");

const normalizeText = (text = "") =>
  text
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

const shouldHideText = (text = "") => {
  const normalized = normalizeText(text);
  return !normalized || CTA_TEXTS.has(normalized);
};

const slugify = (text = "") =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const toSeoSlug = (text = "") =>
  text
    .toLowerCase()
    .trim()
    .replace(/\([^)]*\)/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

const formatCourseTitle = (title = "") => title.replace(/\s+/g, " ").trim();

const formatHeroCourseTitle = (title = "") =>
  formatCourseTitle(title)
    .replace(/\[[^\]]*\]/g, "")
    .replace(/\([^)]*\)/g, "")
    .replace(/\s+/g, " ")
    .trim();

const formatFees = (value: unknown) => {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return "₹" + value.toLocaleString("en-IN");
  }

  if (typeof value === "string" && value.trim()) return value.trim();

  return "N/A";
};

const formatFeeLabel = (value: unknown) => {
  const formatted = formatFees(value);
  return formatted.startsWith("INR ") ? formatted : formatted.replace(/^â‚¹/, "INR ");
};

const getTextList = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.flatMap((item) => getTextList(item)).filter(Boolean);
  }

  const text = getTextValue(value);
  return text ? [text] : [];
};

const pickFirstText = (...values: unknown[]) =>
  values.flatMap((value) => getTextList(value)).find(Boolean) || "";

const startCaseFromSlug = (value = "") =>
  value
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const normalizeTabSlug = (value = "") =>
  value
    .toLowerCase()
    .replace(/[^a-z]/g, "");

const getCourseFamily = (...parts: string[]) => {
  const combined = parts.join(" ").toLowerCase();

  if (/(mba|pgdm|management|business|executive|bba)/.test(combined)) {
    return "management";
  }

  if (
    /(b\.?tech|btech|m\.?tech|mtech|engineering|technology|computer|data science|artificial intelligence|machine learning)/.test(
      combined
    )
  ) {
    return "engineering";
  }

  if (/(mbbs|medical|health|nursing|dental|pharma)/.test(combined)) {
    return "medical";
  }

  if (/(llb|llm|law|legal)/.test(combined)) {
    return "law";
  }

  if (/(b\.?com|commerce|account|finance|economics)/.test(combined)) {
    return "commerce";
  }

  if (/(ba|arts|humanities|social|psychology|journalism)/.test(combined)) {
    return "arts";
  }

  return "general";
};

const getDerivedCourseLevel = (title = "") => {
  const lowerTitle = title.toLowerCase();

  if (
    /(mba|pgdm|master|postgraduate|post-graduate|m\.?tech|mca|msc|m\.?com|ma|llm)/.test(
      lowerTitle
    )
  ) {
    return "Postgraduate";
  }

  if (
    /(bachelor|undergraduate|under-graduate|b\.?tech|btech|bca|bba|b\.?com|ba|bsc|mbbs|llb)/.test(
      lowerTitle
    )
  ) {
    return "Undergraduate";
  }

  return "Program";
};

const COURSE_EXAM_NAMES = [
  "CAT",
  "XAT",
  "MAT",
  "CMAT",
  "SNAP",
  "GMAT",
  "NMAT",
  "ATMA",
  "CUET",
  "JEE Main",
  "JEE Advanced",
  "GATE",
  "NEET",
  "CLAT",
  "AILET",
  "NIMCET",
  "NBSAT",
];

const getAcceptedExams = (course: any, title = "", categorySlug = "") => {
  const textSources = [
    course?.exams_accepted,
    course?.exam_accepted,
    course?.accepted_exams,
    course?.accepted_exam,
    course?.entrance_exam,
    course?.entrance_exams,
    course?.eligibility,
  ]
    .flatMap((value) => getTextList(value))
    .map((value) => normalizeText(value));

  const matchedExams = COURSE_EXAM_NAMES.filter((exam) =>
    textSources.some((text) => text.includes(normalizeText(exam)))
  );

  if (matchedExams.length > 0) {
    return Array.from(new Set(matchedExams)).join(" / ");
  }

  const family = getCourseFamily(
    title,
    pickFirstText(course?.stream, course?.course_stream, course?.stream_name),
    categorySlug
  );
  const lowerTitle = title.toLowerCase();

  switch (family) {
    case "management":
      return "CAT / XAT / MAT / CMAT / SNAP";
    case "engineering":
      return /(m\.?tech|mtech)/.test(lowerTitle)
        ? "GATE"
        : "JEE Main / JEE Advanced";
    case "medical":
      return "NEET";
    case "law":
      return /llm/.test(lowerTitle) ? "CLAT PG" : "CLAT / AILET";
    default:
      return "Entrance / merit based";
  }
};

const getDefaultEligibility = (title = "", family = "general", level = "") => {
  const lowerTitle = title.toLowerCase();
  const normalizedLevel = level.toLowerCase();

  switch (family) {
    case "management":
      return "Graduation from a recognized university";
    case "engineering":
      return /(m\.?tech|mtech)/.test(lowerTitle)
        ? "B.E. / B.Tech in a relevant discipline"
        : "Class 12 with PCM from a recognized board";
    case "medical":
      return "Class 12 with PCB from a recognized board";
    case "law":
      return /llm/.test(lowerTitle)
        ? "LLB from a recognized university"
        : "Class 12 from a recognized board";
    default:
      return normalizedLevel.includes("post")
        ? "Graduation from a recognized university"
        : "Class 12 from a recognized board";
  }
};

const getStudyCupsOffer = (family = "general") => {
  switch (family) {
    case "management":
      return "Up to INR 1 Lakh scholarship + counselling";
    case "engineering":
      return "Free counselling and college shortlist";
    case "medical":
      return "Admission guidance and counselling support";
    case "law":
      return "Application guidance and shortlist support";
    default:
      return "Free counselling and admission support";
  }
};

const buildHeroDescription = (course: any, title = "", totalColleges = 0) => {
  const customDescription = pickFirstText(
    course?.short_description,
    course?.description,
    course?.overview,
    course?.summary
  );

  if (customDescription) {
    return replaceBrand(customDescription);
  }

  const details = [
    pickFirstText(course?.duration),
    pickFirstText(course?.mode),
    totalColleges > 0 ? `${totalColleges}+ colleges` : "",
  ].filter(Boolean);

  const detailText = details.length ? ` with ${details.join(", ")}.` : ".";

  return `Explore ${title} admission 2026 with fees, eligibility, syllabus, and colleges offering this course${detailText}`;
};

const formatCollegeFeeLabel = (value: number) => {
  if (!Number.isFinite(value) || value <= 0) return "N/A";

  const lakhs = Math.round((value / 100000) * 100) / 100;
  return `INR ${lakhs}L`;
};

const getCollegeTypeLabel = (college: any) =>
  [
    college?.college_type,
    college?.basic?.college_type,
    college?.rawScraped?.basic?.college_type,
    college?.type,
  ]
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .find(Boolean) || "";

const getCollegeRoute = (college: any) =>
  `/university/${college.id}-${toSeoSlug(college.name || "")}`;

const normalizeTableRows = (value: unknown): string[][] => {
  if (!Array.isArray(value) || value.length === 0) return [];

  if (Array.isArray(value[0])) {
    return value
      .map((row) =>
        Array.isArray(row)
          ? row.map((cell) => replaceBrand(getTextValue(cell))).filter(Boolean)
          : [replaceBrand(getTextValue(row))].filter(Boolean)
      )
      .filter((row) => row.length > 0);
  }

  return [
    value
      .map((cell) => replaceBrand(getTextValue(cell)))
      .filter(Boolean),
  ].filter((row) => row.length > 0);
};

const normalizeBlock = (block: any) => {
  if (!block) return null;

  const blockType =
    typeof block?.type === "string" ? block.type.toLowerCase() : "text";

  if (blockType === "text") {
    const value = replaceBrand(getTextValue(block?.value ?? block));
    if (shouldHideText(value)) return null;
    return { type: "text", value };
  }

  if (blockType === "list") {
    const value = (Array.isArray(block?.value) ? block.value : [])
      .map((item: unknown) => replaceBrand(getTextValue(item)))
      .filter((item: string) => !shouldHideText(item));

    return value.length ? { type: "list", value } : null;
  }

  if (blockType === "table") {
    const value = normalizeTableRows(block?.value);
    return value.length ? { type: "table", value } : null;
  }

  if (blockType === "image") {
    const src = getTextValue(block?.src || block?.value);
    return src ? { type: "image", src } : null;
  }

  if (blockType === "video") {
    const src = getTextValue(block?.src || block?.value);
    return src ? { type: "video", src } : null;
  }

  if (blockType === "heading") {
    const value = replaceBrand(getTextValue(block?.value));
    return value ? { type: "heading", value, level: block?.level || "h3" } : null;
  }

  const fallback = replaceBrand(getTextValue(block));
  return shouldHideText(fallback) ? null : { type: "text", value: fallback };
};

const normalizeBlocksArray = (data: unknown) => {
  if (!data) return [];

  if (!Array.isArray(data)) {
    const normalized = normalizeBlock(data);
    return normalized ? [normalized] : [];
  }

  return data.map(normalizeBlock).filter(Boolean);
};

const stripDuplicateHeading = (blocks: any[], heading = "") => {
  if (!blocks.length || !heading) return blocks;

  const firstBlock = blocks[0];
  if (
    firstBlock?.type === "text" &&
    normalizeText(firstBlock.value) === normalizeText(heading)
  ) {
    return blocks.slice(1);
  }

  if (
    firstBlock?.type === "heading" &&
    normalizeText(firstBlock.value) === normalizeText(heading)
  ) {
    return blocks.slice(1);
  }

  return blocks;
};

const hasStructuredContent = (data: any) => {
  if (!data) return false;

  if (normalizeBlocksArray(data?.about).length > 0) {
    return true;
  }

  if (Array.isArray(data?.toc_sections)) {
    return data.toc_sections.some(
      (section: any) => normalizeBlocksArray(section?.content).length > 0
    );
  }

  return normalizeBlocksArray(data).length > 0;
};

const StructuredCourseContent: React.FC<{
  title: string;
  data: any;
  emptyMessage: string;
}> = ({ title, data, emptyMessage }) => {
  const aboutBlocks = useMemo(() => normalizeBlocksArray(data?.about), [data]);
  const tocSections = useMemo(
    () => (Array.isArray(data?.toc_sections) ? data.toc_sections : []),
    [data]
  );

  if (!aboutBlocks.length && tocSections.length === 0) {
    return (
      <section className="bg-white border rounded-2xl p-6 shadow-sm">
        <p className="text-sm text-slate-500">{emptyMessage}</p>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      {aboutBlocks.length > 0 && (
        <section className="bg-white border rounded-2xl p-6 shadow-sm">
          <h2 className="text-xl md:text-2xl font-bold text-blue-900 mb-4">
            {title}
          </h2>
          <FlexibleBlockRenderer blocks={aboutBlocks as any} />
        </section>
      )}

      {tocSections.length > 1 && (
        <section className="bg-white border rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-4">
            Table of Contents
          </h2>
          <div className="flex flex-wrap gap-2">
            {tocSections.map((section: any, index: number) => {
              const sectionTitle = getTextValue(section?.section);
              if (!sectionTitle) return null;

              return (
                <a
                  key={`${sectionTitle}-${index}`}
                  href={`#${slugify(sectionTitle)}`}
                  className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-700 hover:border-blue-200 hover:text-blue-700"
                >
                  {sectionTitle}
                </a>
              );
            })}
          </div>
        </section>
      )}

      {tocSections.map((section: any, index: number) => {
        const sectionTitle = getTextValue(section?.section) || `Section ${index + 1}`;
        const blocks = stripDuplicateHeading(
          normalizeBlocksArray(section?.content),
          sectionTitle
        );

        if (!blocks.length) return null;

        return (
          <section
            key={`${sectionTitle}-${index}`}
            id={slugify(sectionTitle)}
            className="bg-white border rounded-2xl p-6 shadow-sm scroll-mt-28"
          >
            <h3 className="text-lg md:text-xl font-bold text-slate-900 mb-4">
              {sectionTitle}
            </h3>
            <FlexibleBlockRenderer blocks={blocks as any} />
          </section>
        );
      })}
    </div>
  );
};

const CourseDetailPage: React.FC<CourseDetailPageProps> = ({ onOpenApplyNow }) => {
  const { categorySlug, courseSlug, tabSlug } = useParams<{
    categorySlug: string;
    courseSlug: string;
    tabSlug?: string;
  }>();
  const navigate = useNavigate();
  const location = useLocation();

  const [activeTab, setActiveTab] = useState<CourseTab>("Overview");
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [comparedCollegeIds, setComparedCollegeIds] = useState<string[]>([]);
  const [desktopSidebarTop, setDesktopSidebarTop] = useState(DESKTOP_SIDEBAR_STICKY_TOP);
  const desktopSidebarRef = useRef<HTMLDivElement | null>(null);

  const exactName = useMemo(
    () => new URLSearchParams(location.search).get("name") || "",
    [location.search]
  );
  const tabFromRoute = useMemo<CourseTab>(
    () => TAB_SLUG_TO_KEY[normalizeTabSlug(tabSlug)] || "Overview",
    [tabSlug]
  );

  useEffect(() => {
    setComparedCollegeIds([]);
  }, [courseSlug]);

  useEffect(() => {
    if (!courseSlug) {
      setCourse(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    const requestUrl = exactName
      ? `${API_BASE}/course/${courseSlug}?name=${encodeURIComponent(exactName)}`
      : `${API_BASE}/course/${courseSlug}`;

    fetch(requestUrl)
      .then((res) => {
        if (!res.ok) throw new Error("API failed");
        return res.json();
      })
      .then((data) => {
        if (data?.success && data?.course) {
          setCourse({
            ...data.course,
            collegesOffering: Array.isArray(data.collegesOffering)
              ? data.collegesOffering
              : [],
            allCollegesData: Array.isArray(data.allCollegesData)
              ? data.allCollegesData
              : [],
          });
          return;
        }

        setCourse(null);
      })
      .catch((err) => {
        console.error("Course detail API error:", err);
        setCourse(null);
      })
      .finally(() => setLoading(false));
  }, [courseSlug, exactName]);

  const collegesOffering = useMemo(() => {
    const source = Array.isArray(course?.collegesOffering) ? course.collegesOffering : [];
    return [...new Map(source.map((item: any) => [String(item?.id), item])).values()];
  }, [course?.collegesOffering]);
  const baseCoursePath = useMemo(() => {
    if (!course) return "";

    const resolvedTitle = course?.course_name || course?.name || "";
    const resolvedCategory = pickFirstText(
      course?.stream,
      course?.course_stream,
      course?.stream_name,
      categorySlug ? startCaseFromSlug(categorySlug) : ""
    );

    return buildCourseDetailPath(resolvedCategory || categorySlug || "general", resolvedTitle);
  }, [categorySlug, course]);
  const buildTabPath = (tab: CourseTab) =>
    baseCoursePath ? `${baseCoursePath}/${TAB_KEY_TO_SLUG[tab]}` : "";
  const canonicalPath = useMemo(() => {
    return buildTabPath(activeTab);
  }, [activeTab, baseCoursePath]);
  const canonicalUrl = useMemo(() => {
    if (!canonicalPath) return "";
    if (typeof window === "undefined") return canonicalPath;
    return `${window.location.origin}${canonicalPath}`;
  }, [canonicalPath]);
  const hasSyllabusContent = useMemo(
    () => hasStructuredContent(course?.syllabus_detail),
    [course?.syllabus_detail]
  );
  const availableTabs = useMemo(() => {
    const tabs: CourseTab[] = ["Overview"];
    if (hasSyllabusContent) tabs.push("Syllabus");
    tabs.push("Top Colleges");
    return tabs;
  }, [hasSyllabusContent]);

  useEffect(() => {
    const nextTab =
      tabFromRoute === "Syllabus" && !hasSyllabusContent
        ? "Overview"
        : tabFromRoute;

    if (activeTab !== nextTab) {
      setActiveTab(nextTab);
    }
  }, [activeTab, hasSyllabusContent, tabFromRoute]);

  useEffect(() => {
    if (!course || !baseCoursePath) return;

    const searchParams = new URLSearchParams(location.search);
    searchParams.delete("name");

    const nextSearch = searchParams.toString();
    const nextTab =
      tabFromRoute === "Syllabus" && !hasSyllabusContent
        ? "Overview"
        : tabFromRoute;
    const nextPath = buildTabPath(nextTab);
    const nextUrl = nextSearch ? `${nextPath}?${nextSearch}` : nextPath;
    const currentUrl = `${location.pathname}${location.search}`;

    if (currentUrl !== nextUrl) {
      navigate(nextUrl, { replace: true });
    }
  }, [
    baseCoursePath,
    course,
    hasSyllabusContent,
    location.pathname,
    location.search,
    navigate,
    tabFromRoute,
  ]);

  const handleTabChange = (tab: CourseTab) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: "auto" });

    const nextPath = buildTabPath(tab);
    const currentUrl = `${location.pathname}${location.search}`;

    if (nextPath && currentUrl !== nextPath) {
      navigate(nextPath);
    }
  };

  const toggleComparedCollege = (collegeId: string) => {
    setComparedCollegeIds((prev) =>
      prev.includes(collegeId)
        ? prev.filter((id) => id !== collegeId)
        : [...prev, collegeId]
    );
  };

  const courseTitle = course?.course_name || course?.name || "Course";
  const avgRating = Number(course?.avgRating || 0);
  const totalColleges = Number(course?.totalColleges ?? course?.total_college_count ?? 0) || 0;
  const streamLabel = replaceBrand(
    pickFirstText(
      course?.stream,
      course?.course_stream,
      course?.stream_name,
      categorySlug ? startCaseFromSlug(categorySlug) : ""
    ) || "General Program"
  );
 const rawLevelLabel = pickFirstText(course?.course_level, course?.level);
 const levelLabel =
  rawLevelLabel && !["n/a", "na", "not available"].includes(normalizeText(rawLevelLabel))
    ? rawLevelLabel
    : getDerivedCourseLevel(courseTitle);
  const courseFamily = getCourseFamily(courseTitle, streamLabel, categorySlug || "");
  const acceptedExams = getAcceptedExams(course, courseTitle, categorySlug || "");
  const eligibilityText = replaceBrand(
    pickFirstText(course?.eligibility, course?.min_eligibility, course?.eligibility_text) ||
      getDefaultEligibility(courseTitle, courseFamily, levelLabel)
  );
  const studyCupsOffer = getStudyCupsOffer(courseFamily);
  const heroDescription = buildHeroDescription(course, courseTitle, totalColleges);
  const quickFactsTitle = formatCourseTitle(courseTitle);
  const courseQuickFacts = [
    { label: "Duration", value: pickFirstText(course?.duration) || "N/A" },
    { label: "Level", value: replaceBrand(levelLabel) || "N/A" },
    { label: "Min. Eligibility", value: eligibilityText || "N/A" },
    { label: "Main Exams", value: acceptedExams || "N/A" },
    { label: "Fee Range", value: formatFeeLabel(course?.avg_fees ?? course?.fees) },
    { label: "Partner Colleges", value: totalColleges > 0 ? `${totalColleges}+` : "N/A" },
    { label: "StudyCups Offer", value: studyCupsOffer || "N/A" },
  ];
  const currentContent =
    activeTab === "Syllabus" && hasSyllabusContent
      ? course?.syllabus_detail
      : course?.course_detail;

  useEffect(() => {
    if (typeof window === "undefined" || loading) return;

    const node = desktopSidebarRef.current;
    if (!node) return;

    const updateStickyTop = () => {
      if (window.innerWidth < 1024) {
        setDesktopSidebarTop(DESKTOP_SIDEBAR_STICKY_TOP);
        return;
      }

      const sidebarHeight = node.getBoundingClientRect().height;
      const bottomLockedTop =
        window.innerHeight - sidebarHeight - DESKTOP_SIDEBAR_BOTTOM_GAP;

      setDesktopSidebarTop(
        Math.min(DESKTOP_SIDEBAR_STICKY_TOP, Math.round(bottomLockedTop))
      );
    };

    updateStickyTop();

    const resizeObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => updateStickyTop())
        : null;

    resizeObserver?.observe(node);
    window.addEventListener("resize", updateStickyTop);

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener("resize", updateStickyTop);
    };
  }, [loading, activeTab, courseTitle, courseQuickFacts.length]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500">
        Loading course data...
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-500">
        Course not found
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-10">
      <Helmet>
        <title>{`${courseTitle} 2026 | Fees, Syllabus, Colleges | StudyCups`}</title>
        <meta
          name="description"
          content={`Explore ${courseTitle} including fees, duration, syllabus, course details and colleges offering this course.`}
        />
        {canonicalUrl ? <link rel="canonical" href={canonicalUrl} /> : null}
        {canonicalUrl ? <meta property="og:url" content={canonicalUrl} /> : null}
      </Helmet>

      <section className="relative overflow-hidden bg-[linear-gradient(120deg,#041a31_0%,#072746_62%,#10273d_100%)]">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-[-8%] top-[14%] h-56 w-56 rounded-full bg-[#0ea5b7]/12 blur-3xl" />
          <div className="absolute bottom-[-10%] right-[-4%] h-72 w-72 rounded-full bg-[#f3a11c]/12 blur-3xl" />
        </div>

        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.6fr)_360px] lg:items-start">
            <div className="max-w-[760px] text-white">
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <span className="inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-cyan-200">
  {replaceBrand(levelLabel)}
</span>
                <span className="inline-flex rounded-full border border-[#f3a11c]/35 bg-[#f3a11c]/8 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-[#f3a11c]">
                  {streamLabel}
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
                    onClick={() => navigate("/courses")}
                    className="transition hover:text-white"
                  >
                    Course
                  </button>
                  <span className="text-white/30">&lt;</span>
                  <span className="font-medium text-[#f3a11c]">
                    {formatCourseTitle(courseTitle)}
                  </span>
                </div>

                <h1
                  className="mt-5 text-[2.35rem] leading-[0.98] text-white md:text-[3.35rem]"
                  style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
                >
                  {formatHeroCourseTitle(courseTitle)}
                </h1>
                <p
                  className="text-[2.15rem] italic leading-none text-[#f3a11c] md:text-[3rem]"
                  style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
                >
                  Admission 2026
                </p>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-white/80">
                {avgRating > 0 && (
                  <span className="font-semibold text-yellow-300">
                    Star {avgRating.toFixed(1)} Avg Rating
                  </span>
                )}
                {course?.duration && <span>{course.duration}</span>}
                {course?.mode && <span>{course.mode}</span>}
              </div>

              <p className="mt-4 max-w-[620px] text-sm leading-7 text-white/75 md:text-[0.98rem]">
                {heroDescription}
              </p>

              <div className="mt-6 grid max-w-[720px] grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
                  <p className="text-[11px] uppercase tracking-[0.12em] text-white/55">
                    Duration
                  </p>
                  <p className="mt-1 text-lg font-bold text-white">
                    {pickFirstText(course?.duration) || "N/A"}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
                  <p className="text-[11px] uppercase tracking-[0.12em] text-white/55">
                    Avg Fees
                  </p>
                  <p className="mt-1 text-lg font-bold text-white">
                    {formatFeeLabel(course?.avg_fees ?? course?.fees)}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
                  <p className="text-[11px] uppercase tracking-[0.12em] text-white/55">
                    Colleges
                  </p>
                  <p className="mt-1 text-lg font-bold text-white">{totalColleges || 0}</p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
                  <p className="text-[11px] uppercase tracking-[0.12em] text-white/55">
                    Mode
                  </p>
                  <p className="mt-1 text-lg font-bold text-white">
                    {pickFirstText(course?.mode, course?.study_mode) || "N/A"}
                  </p>
                </div>
              </div>
            </div>

            <div className="w-full lg:max-w-[360px]">
              <div className="rounded-[28px] border border-[#0b6675]/60 bg-[linear-gradient(180deg,rgba(27,58,82,0.96)_0%,rgba(26,47,67,0.92)_100%)] p-5 shadow-[0_24px_50px_rgba(4,20,38,0.24)] backdrop-blur">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-white/45">
                  Course Snapshot
                </p>

                <div className="mt-5 rounded-2xl border border-[#0b6675]/60 bg-[#0d4253]/35 p-4">
                  <p className="text-[11px] uppercase tracking-[0.12em] text-cyan-100/70">
                    StudyCups guidance
                  </p>
                  <p className="mt-2 text-sm leading-6 text-white/82">
                    Verified admission support for your course, budget, and shortlist.
                  </p>
                </div>

                <div className="mt-4 space-y-3">
                  {[
                    { label: "Exam", value: acceptedExams },
                    { label: "Eligibility", value: eligibilityText },
                    { label: "StudyCups Offer", value: studyCupsOffer },
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

      <div className="relative bg-[var(--primary-dark)] mt-5">
        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-8 text-white">
          <button
            onClick={() => navigate(-1)}
            className="mb-4 mt-12 inline-flex items-center gap-2 text-sm font-semibold hover:opacity-90"
          >
            <span className="inline-block rounded bg-white/10 px-2 py-1">←</span>
            Back to Courses
          </button>

          <h1 className="text-3xl sm:text-4xl lg:text-3xl font-extrabold tracking-tight drop-shadow-sm">
            {formatCourseTitle(courseTitle)}
          </h1>

          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-white/90">
            {avgRating > 0 && (
              <span className="font-semibold text-yellow-300">
                ⭐ {avgRating.toFixed(1)} Avg Rating
              </span>
            )}
            {course?.stream && <span>{replaceBrand(course.stream)}</span>}
            {course?.duration && <span>{course.duration}</span>}
            {course?.mode && <span>{course.mode}</span>}
          </div>

          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            <div className="rounded-xl bg-white/10 px-4 py-3">
              <p className="text-xs text-white/80">Duration</p>
              <p className="text-lg font-bold">{course?.duration || "N/A"}</p>
            </div>

            <div className="rounded-xl bg-white/10 px-4 py-3">
              <p className="text-xs text-white/80">Avg Fees</p>
              <p className="text-lg font-bold">{formatFees(course?.avg_fees ?? course?.fees)}</p>
            </div>

            <div className="rounded-xl bg-white/10 px-4 py-3">
              <p className="text-xs text-white/80">Course Level</p>
              <p className="text-lg font-bold">
                {course?.course_level ?? course?.level ?? 0}
              </p>
            </div>

            <div className="rounded-xl bg-white/10 px-4 py-3">
              <p className="text-xs text-white/80">Mode</p>
              <p className="text-lg font-bold">{course?.mode || "N/A"}</p>
            </div>
          </div>
        </div>
      </div>
      )}

      <div className="sticky top-[54px] md:top-[70px] z-40 border-b border-[#d9d4ca] bg-[#f2efe8] shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-6 overflow-x-auto no-scrollbar">
            {availableTabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => handleTabChange(tab)}
                className={`whitespace-nowrap border-b-2 px-2 py-4 text-sm font-semibold transition ${
                  activeTab === tab
                    ? "border-[#0f7a83] text-[#0f7a83]"
                    : "border-transparent text-slate-500 hover:text-[#0f7a83]"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <main className="lg:col-span-2 space-y-6">
            {activeTab === "Top Colleges" ? (
              <section className="bg-white border rounded-2xl p-6 shadow-sm">
                <h2 className="text-xl md:text-2xl font-bold text-blue-900">
                  Colleges Offering This Course
                </h2>

                {collegesOffering.length > 0 ? (
                  <div className="mt-5 space-y-4">
                    {collegesOffering.map((college: any) => {
                      const collegeId = String(college?.id ?? "");
                      const collegeType = getCollegeTypeLabel(college);
                      const annualFee = formatCollegeFeeLabel(
                        Number(college?.feesRange?.min ?? course?.avg_fees ?? course?.fees ?? 0)
                      );
                      const ratingValue = Number(college?.rating ?? 0);
                      const catLikePercent = ratingValue > 0 ? `${Math.round(ratingValue * 20)}+` : "N/A";
                      const totalReviews = Number(college?.reviewCount ?? college?.reviews ?? 0);
                      const reviewsLabel =
                        Number.isFinite(totalReviews) && totalReviews > 0
                          ? totalReviews.toLocaleString("en-IN")
                          : "0";
                      const cardLabel = formatHeroCourseTitle(courseTitle) || streamLabel;
                      const collegeLogo =
                        college?.logo ||
                        college?.logoUrl ||
                        college?.image ||
                        college?.rawScraped?.logo ||
                        "/no-image.jpg";
                      const isCompared = comparedCollegeIds.includes(collegeId);

                      return (
                        <article
                          key={college.id}
                          className="overflow-hidden rounded-2xl border border-[#d8d2c5] bg-white"
                        >
                          <div className="border-l-4 border-[#148d99] p-4 md:p-5">
                            <div className="grid grid-cols-1 xl:grid-cols-[1fr_auto] gap-4">
                              <div>
                                <div className="flex items-start gap-4">
                                  <img
                                    src={collegeLogo}
                                    alt={college.name || "College"}
                                    className="h-14 w-14 rounded-xl border border-[#ddd5c8] bg-[#f4f1ea] object-contain p-2"
                                  />
                                  <div className="min-w-0">
                                    <p className="text-xs font-semibold text-[#167f8b] md:text-sm">
                                      {cardLabel || "Courses Available"}
                                    </p>
                                    <button
                                      type="button"
                                      onClick={() => navigate(getCollegeRoute(college))}
                                      className="mt-0.5 block text-left text-lg font-semibold leading-tight text-[#10233e] hover:underline md:text-[28px]"
                                      style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
                                    >
                                      {college.name}
                                    </button>
                                    <p className="mt-1 text-sm text-slate-500">
                                      {college.location || "Location not available"}
                                    </p>
                                  </div>
                                </div>

                                <div className="mt-3 grid grid-cols-3 overflow-hidden rounded-xl border border-[#d7d1c5] text-center">
                                  <div className="border-r border-[#d7d1c5] py-2">
                                    <p className="font-serif text-[18px] leading-none text-[#10233e] md:text-[20px]">
                                      {annualFee}
                                    </p>
                                    <p className="mt-1 text-[11px] text-slate-500">Annual Fee</p>
                                  </div>
                                  <div className="border-r border-[#d7d1c5] py-2">
                                    <p className="font-serif text-[18px] leading-none text-[#10233e] md:text-[20px]">
                                      {catLikePercent}
                                    </p>
                                    <p className="mt-1 text-[11px] text-slate-500">CAT %ile</p>
                                  </div>
                                  <div className="py-2">
                                    <p className="font-serif text-[18px] leading-none text-[#10233e] md:text-[20px]">
                                      {reviewsLabel}
                                    </p>
                                    <p className="mt-1 text-[11px] text-slate-500">Total Reviews</p>
                                  </div>
                                </div>

                                <div className="mt-3 flex flex-wrap gap-2">
                                  <span className="rounded-full border border-[#d8d2c5] bg-[#f6f2e9] px-3 py-1 text-xs text-[#10233e]">
                                    {ratingValue > 0 ? `${ratingValue.toFixed(1)} Rating` : "Rating N/A"}
                                  </span>
                                  {collegeType && (
                                    <span className="rounded-full border border-[#d8d2c5] bg-[#f6f2e9] px-3 py-1 text-xs text-[#10233e]">
                                      {collegeType}
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="flex gap-2 xl:min-w-[170px] xl:flex-col xl:justify-center">
                                <button
                                  type="button"
                                  onClick={onOpenApplyNow}
                                  className="rounded-xl bg-[#ee9b16] px-5 py-2.5 text-sm font-semibold text-[#10233e]"
                                >
                                  Get Guidance
                                </button>
                                <button
                                  type="button"
                                  onClick={() => navigate(getCollegeRoute(college))}
                                  className="inline-flex items-center justify-center rounded-xl bg-[#0f6f79] px-5 py-2.5 text-sm font-semibold text-white"
                                >
                                  Check Details
                                </button>
                                <button
                                  type="button"
                                  onClick={() => toggleComparedCollege(collegeId)}
                                  className={`inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold ${
                                    isCompared ? "bg-[#1e7d43] text-white" : "bg-[#132a4a] text-white"
                                  }`}
                                >
                                  {isCompared ? "Compared" : "Compare"}
                                </button>
                              </div>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-slate-500">
                    No colleges linked for this course yet.
                  </p>
                )}
              </section>
            ) : (
              <StructuredCourseContent
                title={
                  activeTab === "Overview"
                    ? `About ${formatCourseTitle(courseTitle)}`
                    : `${formatCourseTitle(courseTitle)} Syllabus`
                }
                data={currentContent}
                emptyMessage={
                  activeTab === "Overview"
                    ? "Course details are not available right now."
                    : "Syllabus details are not available right now."
                }
              />
            )}
          </main>

          <aside className="space-y-5 w-full">
            <div
              ref={desktopSidebarRef}
              className="lg:sticky space-y-5"
              style={{ top: desktopSidebarTop }}
            >
       

              <div className="overflow-hidden rounded-[24px] bg-[linear-gradient(180deg,#081c33_0%,#133252_100%)] p-6 text-white shadow-[0_20px_45px_rgba(7,29,53,0.16)]">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#0f7a83] text-xs font-bold ">
                  SC
                </div>

                <div className="mt-4 text-center">
                  <h3
                    className="text-[1.3rem] leading-tight text-white"
                    style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
                  >
                    Free Counselling
                  </h3>
                  <p className="mt-1 text-sm text-white/68">
                    StudyCups Expert Counsellors
                  </p>
                </div>

                <div className="mt-4 text-center">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#f3a11c]">
                    ⭐⭐⭐⭐⭐
                  </p>
                  <p className="mt-1 text-xs text-white/55">
                    4.6 / 5 from 1,065 Justdial reviews
                  </p>
                </div>

                <div className="mt-5 space-y-3">
                  <a
                    href="tel:+918081269969"
                    className="flex min-h-[50px] items-center justify-center rounded-xl bg-[#f3a11c] px-4 text-sm font-bold text-[#071d35] transition hover:brightness-105"
                  >
                    📞Call 8081269969
                  </a>
                  <a
                    href="https://wa.me/918081269969"
                    target="_blank"
                    rel="noreferrer"
                    className="flex min-h-[50px] items-center justify-center rounded-xl border border-[#1f7a61] bg-[#11443f] px-4 text-sm font-semibold text-[#63e6b0] transition hover:bg-[#14514b]"
                  >
                    🗨️WhatsApp Us
                  </a>
                </div>
              </div>

              <div className="overflow-hidden rounded-[22px] border border-[#d8d1c6] bg-white shadow-sm">
                <div className="bg-[#061d34] px-5 py-4">
                  <h3 className="text-base font-bold text-white">
                    {quickFactsTitle} Quick Facts
                  </h3>
                </div>

                <div className="space-y-3 p-5">
                  {courseQuickFacts.map((fact) => (
                    <div
                      key={fact.label}
                      className="flex items-start justify-between gap-4 rounded-xl bg-[#f6f1e8] px-4 py-3"
                    >
                      <span className="text-sm text-slate-500">{fact.label}</span>
                      <span className="max-w-[58%] text-right text-sm font-semibold text-slate-800">
                        {fact.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="overflow-hidden rounded-[22px] border border-[#d8d1c6] bg-white shadow-sm">
                <div className="bg-[#061d34] px-5 py-4">
                  <h3 className="text-base font-bold text-white">
                    Scholarships Available
                  </h3>
                </div>

                <div className="space-y-3 p-5">
                  {[
                    {
                      title: "StudyCups Partner Scholarship",
                      value: "Up to INR 1,00,000 off",
                    },
                    {
                      title: "Merit-based (High CAT score)",
                      value: "10-50% tuition waiver",
                    },
                    {
                      title: "SBI / HDFC Education Loan",
                      value: "Up to INR 40L @ 8.5% p.a.",
                    },
                    {
                      title: "College Diversity Scholarships",
                      value: "Varies by college",
                    },
                  ].map((item) => (
                    <div
                      key={item.title}
                      className="rounded-xl border border-[#ded7cc] bg-[#f6f1e8] px-4 py-3"
                    >
                      <p className="text-sm font-medium text-slate-800">{item.title}</p>
                      <p className="mt-1 text-sm font-semibold text-[#0f7a83]">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default CourseDetailPage;
